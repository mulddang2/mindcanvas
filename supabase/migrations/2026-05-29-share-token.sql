-- 이슈 #21 권한 관리 — canvases 테이블에 single-token share link 컬럼 추가.
-- 적용은 Supabase Studio SQL Editor에서 수동.

alter table public.canvases
  add column share_token uuid null,
  add column share_role text null check (share_role in ('view', 'edit'));

-- share_token으로 조회하는 라우트(/canvas/share/[token])에서 인덱스 활용.
create index if not exists canvases_share_token_idx
  on public.canvases (share_token)
  where share_token is not null;

-- RLS 정책 업데이트는 PR3에서 따로. PR1 시점엔 owner_id 기반 기존 정책 그대로 유지 —
-- share_token 컬럼은 추가만 되고 RLS는 owner만 SELECT/UPDATE 가능.
