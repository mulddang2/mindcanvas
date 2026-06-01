-- 이슈 #21 권한 관리 — share_role='edit' 토큰 보유자가 data 필드를 UPDATE할 수 있는 RLS.
-- 적용은 Supabase Studio SQL Editor에서 수동.

-- CREATE POLICY는 IF NOT EXISTS를 지원하지 않아 DROP 후 생성으로 멱등 보장.
drop policy if exists "share_token edit data" on public.canvases;
create policy "share_token edit data"
  on public.canvases
  for update
  using (
    share_token is not null
    and share_role = 'edit'
    and share_token::text = current_setting('request.headers', true)::json->>'x-share-token'
  )
  with check (
    share_token is not null
    and share_role = 'edit'
    and share_token::text = current_setting('request.headers', true)::json->>'x-share-token'
  );

-- 주: 클라이언트(createBrowserClient)는 shareTokenStore의 token으로
-- x-share-token 헤더를 자동 주입. title·share_token·share_role·owner_id 변경은
-- owner 정책에서만 허용되므로 본 정책이 추가돼도 anon은 data 필드 외 변경 불가.
