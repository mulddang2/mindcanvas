import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** 보호 경로 prefix. 미로그인 시 /login으로 리다이렉트한다. 로그인·콜백 경로는 제외. */
const PROTECTED_PREFIXES = ['/canvas', '/dashboard'];

/** 매 요청마다 세션 쿠키를 갱신하고, 보호 경로는 미로그인 시 /login으로 보낸다. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser는 세션 토큰을 갱신하면서 사용자 정보를 돌려준다 — 그냥 무시하면 안 됨.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // /canvas/share/[token] 라우트는 anon 접근 허용. 보호 경로에서 제외.
  const isSharedCanvas = pathname.startsWith('/canvas/share/');
  const isProtected =
    !isSharedCanvas && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // 이미 로그인한 사용자가 /login에 접근하면 대시보드로 보낸다.
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
