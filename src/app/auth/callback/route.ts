import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Google OAuth 콜백. Supabase가 보낸 ?code= 쿼리를 받아 세션으로 교환하고 next 경로로 리다이렉트한다.
 * code 없거나 교환 실패 시 /login으로 돌려보낸다.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/canvas/demo';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
