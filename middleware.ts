import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes (require auth)
const PROTECTED = ['/dashboard', '/setup', '/alert', '/report'];
// Public routes (accessible without auth)
const PUBLIC    = ['/track', '/login', '/verify', '/calculator'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED.some(p => path.startsWith(p));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If logged in and hitting /login, redirect to /calculator
  if (path === '/login' && session) {
    return NextResponse.redirect(new URL('/calculator', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
