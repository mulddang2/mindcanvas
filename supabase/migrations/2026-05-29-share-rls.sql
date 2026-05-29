-- 이슈 #21 권한 관리 — share_token 기반 anon SELECT RLS 정책.
-- 토큰을 가진 사람(anon 포함)이 share_token으로 캔버스 조회 가능 (view-only).
-- edit role 공유는 후속 PR. UPDATE/DELETE는 기존 owner_id 정책만 유지.
-- 적용은 Supabase Studio SQL Editor에서 수동.

create policy if not exists "share_token select"
  on public.canvases
  for select
  using (
    share_token is not null
    and share_token::text = current_setting('request.headers', true)::json->>'x-share-token'
  );

-- 주: PostgREST가 클라이언트 요청 헤더 `x-share-token`을 request.headers JSON으로 노출.
-- 클라이언트는 supabase 호출 시 global.headers 옵션으로 토큰 주입.
