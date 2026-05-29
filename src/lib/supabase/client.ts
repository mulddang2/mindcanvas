'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useShareTokenStore } from '@/stores/shareTokenStore';

/**
 * 클라이언트 컴포넌트·이벤트 핸들러에서 쓰는 Supabase 인스턴스. 호출마다 새 클라이언트가 생성된다.
 * 공유 라우트(/canvas/share/[token])에서 진입한 경우 shareTokenStore에 토큰이 들어 있어
 * x-share-token 헤더가 자동 주입된다 — anon이 RLS의 share_token 정책으로 통과되게 한다.
 */
export function createClient() {
  const token = useShareTokenStore.getState().token;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    token ? { global: { headers: { 'x-share-token': token } } } : undefined,
  );
}
