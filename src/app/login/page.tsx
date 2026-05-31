'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const onGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      // signInWithOAuth는 자동으로 OAuth 제공자로 리다이렉트한다. 코드는 여기서 끝.
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-8 shadow-md ring-1 ring-black/5">
      <h1 className="text-2xl font-semibold text-neutral-900">MindCanvas</h1>
      <p className="text-sm text-neutral-500">AI 마인드맵을 만들고 공유하세요.</p>
      <button
        type="button"
        onClick={onGoogle}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-400"
      >
        {loading ? '리다이렉트 중…' : 'Google 계정으로 계속하기'}
      </button>
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-8">
      <Suspense fallback={null}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
