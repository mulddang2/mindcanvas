import type { SupabaseClient } from '@supabase/supabase-js';
import type { ShareRole } from './canvases';

/** 본인 시점에서 한 캔버스에 가지는 권한. null이면 접근 불가. */
export type CanvasRole = 'owner' | ShareRole | null;

/**
 * 새 share 토큰을 발급하고 row에 저장한다. 기존 토큰이 있어도 새 UUID로 교체.
 * 소유자만 호출 가능 — RLS가 owner_id 체크.
 */
export async function generateShareToken(
  client: SupabaseClient,
  canvasId: string,
  role: ShareRole,
): Promise<{ token: string } | { error: string }> {
  const token = crypto.randomUUID();
  const { error } = await client
    .from('canvases')
    .update({ share_token: token, share_role: role })
    .eq('id', canvasId);
  if (error) return { error: error.message };
  return { token };
}

/** share_token·share_role을 NULL로 초기화. 기존 링크는 즉시 무효. */
export async function revokeShareToken(
  client: SupabaseClient,
  canvasId: string,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await client
    .from('canvases')
    .update({ share_token: null, share_role: null })
    .eq('id', canvasId);
  if (error) return { error: error.message };
  return { ok: true };
}

/** 캔버스 row에서 현재 토큰·역할 조회. 소유자만 호출 (RLS). */
export async function getShareInfo(
  client: SupabaseClient,
  canvasId: string,
): Promise<{ token: string | null; role: ShareRole | null } | { error: string }> {
  const { data, error } = await client
    .from('canvases')
    .select('share_token, share_role')
    .eq('id', canvasId)
    .maybeSingle();
  if (error || !data) return { error: error?.message ?? 'not found' };
  return { token: data.share_token, role: data.share_role };
}

/** 'owner'와 'edit'만 데이터 변경 가능. 'view'와 null은 읽기 전용. */
export function canEdit(role: CanvasRole): boolean {
  return role === 'owner' || role === 'edit';
}

/** 'owner'만 캔버스 삭제·제목 변경·공유 토큰 회수 가능. */
export function canManage(role: CanvasRole): boolean {
  return role === 'owner';
}
