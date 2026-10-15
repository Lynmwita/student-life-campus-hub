import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Protected routes definitions
  const protectedRoutes = [
    "/dashboard",
    "/timetable",
    "/campus-life",
    "/announcements",
  ];
  const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding/interests");
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route)) || isOnboardingRoute;

  // 2. Unauthenticated users cannot access protected routes
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 3. Authenticated users visiting auth routes (/login, /register)
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && user) {
    const { count } = await supabase
      .from("student_interests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const url = request.nextUrl.clone();
    if (!count || count === 0) {
      url.pathname = "/onboarding/interests";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // 4. Mandatory Interests Onboarding Gate for Authenticated Users
  // Users with zero recorded interests are intercepted and redirected to /onboarding/interests
  if (user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const { count } = await supabase
      .from("student_interests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!count || count === 0) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding/interests";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
