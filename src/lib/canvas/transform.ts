import type { Point, Viewport } from '@/types/canvas';

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 4;

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function screenToWorld(viewport: Viewport, sx: number, sy: number): Point {
  return {
    x: viewport.x + sx / viewport.scale,
    y: viewport.y + sy / viewport.scale,
  };
}

export function worldToScreen(viewport: Viewport, wx: number, wy: number): Point {
  return {
    x: (wx - viewport.x) * viewport.scale,
    y: (wy - viewport.y) * viewport.scale,
  };
}

/**
 * world 좌표 (wx, wy)가 화면 중앙에 오도록 viewport 원점을 옮긴다. scale은 유지.
 * 화면 절반(px)을 scale로 나눠 world 기준 절반 크기를 빼면 원점이 나온다.
 */
export function centerViewport(
  viewport: Viewport,
  wx: number,
  wy: number,
  screenW: number,
  screenH: number,
): Viewport {
  return {
    ...viewport,
    x: wx - screenW / viewport.scale / 2,
    y: wy - screenH / viewport.scale / 2,
  };
}

/**
 * 마우스 위치(screen 좌표)를 고정점으로 zoom. 커서 아래 world 지점이
 * zoom 후에도 같은 화면 위치에 남도록 viewport 원점을 역산한다.
 */
export function zoomViewport(
  viewport: Viewport,
  sx: number,
  sy: number,
  factor: number,
): Viewport {
  const nextScale = clampScale(viewport.scale * factor);
  const anchor = screenToWorld(viewport, sx, sy);
  return {
    scale: nextScale,
    x: anchor.x - sx / nextScale,
    y: anchor.y - sy / nextScale,
  };
}
