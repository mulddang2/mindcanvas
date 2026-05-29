import { create } from 'zustand';
import type { CanvasRole } from '@/lib/supabase/permissions';

interface RoleStore {
  /** 현재 캔버스에서 본인이 가진 권한. CanvasView가 mount 시 set. */
  role: CanvasRole;
  setRole: (role: CanvasRole) => void;
}

export const useRoleStore = create<RoleStore>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
}));
