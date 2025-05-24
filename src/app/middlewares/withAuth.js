import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export default function withAuth(middleware, requireAuth) {
  return async (req, next) => {
    const pathname = req.nextUrl.pathname;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: sessionData } = await supabase.auth.getUser();

    const session = sessionData;
    const user = session?.user;

    const role = user?.user_metadata?.role || null;

    console.log('Session valid:', !!session, '| Role:', role);

    const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

    if (isAdminRoute) {
      if (!session || role !== 'admin') {
        const url = new URL('/admin/login', req.url);
        url.searchParams.set('callbackUrl', encodeURI(req.url));
        return NextResponse.redirect(url);
      }
    }

    if (pathname === '/admin/login') {
      if (session && role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return await middleware(req, next);
    }
    const needsAuth = requireAuth.some((route) => pathname.startsWith(route));
    if (needsAuth) {
      if (!session) {
        const url = new URL('/admin/login', req.url);
        url.searchParams.set('callbackUrl', encodeURI(req.url));
        return NextResponse.redirect(url);
      }

      if (pathname.startsWith('/admin') && role !== 'admin') {
        const url = new URL('/admin/login', req.url);
        url.searchParams.set('callbackUrl', encodeURI(req.url));
        return NextResponse.redirect(url);
      }
    }

    return await middleware(req, next);
  };
}
