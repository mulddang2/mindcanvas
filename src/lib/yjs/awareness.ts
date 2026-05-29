import type { Awareness } from 'y-protocols/awareness';
import type { NodeColor, Point } from '@/types/canvas';

const USER_STORAGE_KEY = 'mc.userId';
const ID_LENGTH = 8;
const PALETTE: Exclude<NodeColor, 'default'>[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
];

export interface User {
  id: string;
  name: string;
  color: Exclude<NodeColor, 'default'>;
}

function pickColor(id: string): Exclude<NodeColor, 'default'> {
  // 단순 string hash → palette index. 같은 id면 항상 같은 색.
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function makeName(id: string): string {
  return `게스트 ${id.slice(0, 4).toUpperCase()}`;
}

/**
 * 데모 모드용 익명 사용자. localStorage에 한 번 발급된 id를 영구 보관.
 * DB 모드에서 Supabase 사용자 정보로 덮어쓸 hook은 후속 작업.
 */
export function getOrCreateUser(): User {
  let id = localStorage.getItem(USER_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '').slice(0, ID_LENGTH);
    localStorage.setItem(USER_STORAGE_KEY, id);
  }
  return { id, name: makeName(id), color: pickColor(id) };
}

// InfiniteCanvas의 pointer move 핸들러가 직접 awareness를 잡지 않도록 모듈 레벨 reference.
// useAwareness가 mount 시 set, unmount 시 null로 비운다.
let currentAwareness: Awareness | null = null;

export function setCurrentAwareness(awareness: Awareness | null): void {
  currentAwareness = awareness;
}

/** pointer move 핸들러가 매 frame 호출 — null이면 캔버스 밖 또는 awareness 미준비. */
export function broadcastCursor(world: Point | null): void {
  if (!currentAwareness) return;
  currentAwareness.setLocalStateField('cursor', world);
}
