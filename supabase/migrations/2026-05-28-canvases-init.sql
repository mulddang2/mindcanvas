-- canvases 기본 스키마 — 테이블 + owner 기반 RLS.
-- 기존엔 dev에서 Studio로 수동 생성했던 것을 마이그레이션으로 명문화한다.
-- share 마이그레이션(2026-05-29-*)이 이 테이블을 alter하므로 그보다 먼저 적용되어야 한다.
-- 적용은 Supabase Studio SQL Editor에서 수동.

create table if not exists public.canvases (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  title      text not null default '제목 없음',
  data       jsonb not null default '{"nodes": [], "edges": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 대시보드는 소유자별 최신순 조회.
create index if not exists canvases_owner_updated_idx
  on public.canvases (owner_id, updated_at desc);

-- useAutosave는 data만 update하고 updated_at은 건드리지 않으므로 트리거로 자동 갱신.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists canvases_set_updated_at on public.canvases;
create trigger canvases_set_updated_at
  before update on public.canvases
  for each row
  execute function public.set_updated_at();

-- RLS: 소유자만 자기 행 전체 접근. 토큰 공유(anon) 정책은 2026-05-29-share-*.sql에서 추가.
alter table public.canvases enable row level security;

drop policy if exists "owner all" on public.canvases;
create policy "owner all"
  on public.canvases
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
