import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** 로그아웃 후 /login으로 리다이렉트. POST로만 받아 CSRF 노출을 줄인다. */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}
