import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Rate limit sensitive API endpoints
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const rl = checkRateLimit(`api:${ip}`, 60, 60 * 1000);
    if (!rl.success) {
      const rateLimitResponse = NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfterSeconds || 60),
          },
        }
      );
      return applySecurityHeaders(rateLimitResponse);
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth token
  let user = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // Network / offline fallback
  }

  const demoSession = request.cookies.get("smu_demo_session")?.value;
  const demoOnboarded = request.cookies.get("smu_demo_onboarded")?.value;
  const isAuthenticated = Boolean(user || demoSession);

  // 1. Protected routes definitions
  const protectedRoutes = [
    "/dashboard",
    "/timetable",
    "/campus-life",
    "/announcements",
    "/help-desk",
    "/admin",
  ];
  const isOnboardingRoute =
    pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isProtected =
    protectedRoutes.some((route) => pathname.startsWith(route)) ||
    isOnboardingRoute;

  // 2. Unauthenticated users cannot access protected routes
  if (isProtected && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  // 3. Authenticated users visiting auth routes (/login, /register)
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    if (demoSession) {
      url.pathname = demoSession === "student@summit.ac.ke" && !demoOnboarded ? "/onboarding" : "/dashboard";
      return applySecurityHeaders(NextResponse.redirect(url));
    }

    if (user) {
      const { count } = await supabase
        .from("student_interests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (!count || count === 0) {
        url.pathname = "/onboarding";
      } else {
        url.pathname = "/dashboard";
      }
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  // 4. Mandatory Interests Onboarding Gate for Authenticated Users
  // Users with zero recorded interests are intercepted and redirected to /onboarding
  if (user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const { count } = await supabase
      .from("student_interests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!count || count === 0) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  // 5. Staff & Admin Route Authorization Enforcement (B2 & B3)
  const isStaffRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/announcements/new" ||
    pathname.startsWith("/announcements/new/");

  if (isStaffRoute && isAuthenticated) {
    let role = "student";
    if (demoSession) {
      const demoRole = request.cookies.get("smu_demo_role")?.value;
      role =
        demoRole ||
        (demoSession.includes("registrar") || demoSession.includes("admin")
          ? "admin"
          : demoSession.includes("staff")
          ? "staff"
          : "student");
    } else if (user) {
      role = (user.user_metadata?.role as string) || "student";
      if (role === "student") {
        const { data: membership } = await supabase
          .from("university_memberships")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (membership?.role) {
          role = membership.role;
        }
      }
    }

    const isStaffOrAdmin =
      role === "staff" || role === "admin" || role === "super_admin";

    if (!isStaffOrAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("error", "unauthorized_admin_access");
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  return applySecurityHeaders(supabaseResponse);
}
