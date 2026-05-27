'use client';

import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface User {
  email: string;
  name: string | null;
  avatar: string | null;
}

/** 현재 로그인한 사용자 정보 + 로그아웃 버튼. 우하단 Toolbar 위에 떠 있다. */
export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const meta = data.user.user_metadata as Record<string, unknown>;
      setUser({
        email: data.user.email ?? '',
        name: (meta.full_name as string) ?? (meta.name as string) ?? null,
        avatar: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
      });
    });
  }, []);

  if (!user) return null;

  return (
    <form
      action="/auth/signout"
      method="POST"
      className="fixed right-3 bottom-15 z-10 flex items-center gap-2 rounded-md bg-white px-2 py-1.5 shadow-md ring-1 ring-black/10"
    >
      {user.avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar}
          alt=""
          className="h-6 w-6 rounded-full"
          referrerPolicy="no-referrer"
        />
      )}
      <span className="max-w-32 truncate text-xs text-neutral-700">
        {user.name ?? user.email}
      </span>
      <button
        type="submit"
        title="로그아웃"
        className="rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-red-600"
      >
        <LogOut size={14} />
      </button>
    </form>
  );
}
