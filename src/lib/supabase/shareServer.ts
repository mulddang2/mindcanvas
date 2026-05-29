import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * /canvas/share/[token] 라우트 전용 supabase server client.
 * `x-share-token` 헤더를 주입해 RLS의 share_token 정책이 통과되게 한다.
 * cookies는 그대로 — 로그인된 사용자라도 토큰으로 접근 시에는 익명 흐름 따름.
 */
export async function createShareClient(token: string) {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // share 라우트는 인증 갱신과 무관 — set 무시.
        },
      },
      global: {
        headers: { 'x-share-token': token },
      },
    },
  );
}
