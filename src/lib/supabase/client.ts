'use client';

import { createBrowserClient } from '@supabase/ssr';

/** 클라이언트 컴포넌트·이벤트 핸들러에서 쓰는 Supabase 인스턴스. 호출마다 새 클라이언트가 생성된다. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
