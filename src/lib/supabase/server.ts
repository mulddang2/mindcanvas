import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** 서버 컴포넌트·route handler에서 쓰는 Supabase 인스턴스. Next.js cookies()로 세션을 읽고 쓴다. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 set 호출은 무시 — middleware에서 갱신이 흐른다.
          }
        },
      },
    },
  );
}
