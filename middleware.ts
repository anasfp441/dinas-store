import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
cookies.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        },
      },
    }
  );

  await supabase.auth.getSession();

  const isProtected = request.nextUrl.pathname.startsWith("/admin") 
    && !request.nextUrl.pathname.startsWith("/admin/login");

  if (isProtected) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};