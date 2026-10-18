import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("smu_demo_session");
    cookieStore.delete("smu_demo_role");
    cookieStore.delete("smu_demo_onboarded");
  } catch {}

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {}

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  return GET(request);
}
