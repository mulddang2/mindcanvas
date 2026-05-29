import { useRoleStore } from '@/stores/roleStore';
import { canEdit, canManage } from '@/lib/supabase/permissions';

/** 본인 시점에서 편집 가능 여부. owner·edit이면 true. UI 차단 결정에 사용. */
export function useCanEdit(): boolean {
  return useRoleStore((s) => canEdit(s.role));
}

/** owner 전용 액션(공유 회수·제목 변경·캔버스 삭제) 노출 여부. */
export function useCanManage(): boolean {
  return useRoleStore((s) => canManage(s.role));
}
