import { create } from 'zustand';
import type { Viewport } from '@/types/canvas';
import { zoomViewport, centerViewport } from '@/lib/canvas/transform';

const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 };

interface CanvasStore {
  viewport: Viewport;
  /** screen 픽셀 이동량을 받아 viewport 원점을 옮긴다 (드래그 방향의 반대). */
  panBy: (dxScreen: number, dyScreen: number) => void;
  /** 커서 위치를 고정점으로 zoom. */
  zoomAt: (screenX: number, screenY: number, factor: number) => void;
  /** world 좌표 (wx, wy)가 화면 중앙에 오도록 viewport 원점을 옮긴다. scale은 유지. */
  centerOn: (wx: number, wy: number, screenW: number, screenH: number) => void;
  resetViewport: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  viewport: INITIAL_VIEWPORT,
  panBy: (dxScreen, dyScreen) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x - dxScreen / state.viewport.scale,
        y: state.viewport.y - dyScreen / state.viewport.scale,
      },
    })),
  zoomAt: (screenX, screenY, factor) =>
    set((state) => ({
      viewport: zoomViewport(state.viewport, screenX, screenY, factor),
    })),
  centerOn: (wx, wy, screenW, screenH) =>
    set((state) => ({
      viewport: centerViewport(state.viewport, wx, wy, screenW, screenH),
    })),
  resetViewport: () => set({ viewport: INITIAL_VIEWPORT }),
}));
