import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Eğer kullanıcı giriş yapmışsa ve login/register sayfasına gitmek istiyorsa -> /admin'e at
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 2. Eğer kullanıcı giriş yapmamışsa ve /admin sayfalarına girmek istiyorsa -> /login'e at
  if (!token && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/register'],
};