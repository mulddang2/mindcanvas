import type { Viewport } from '@/types/canvas';
import { getVisibleBounds } from './viewport';

const BASE_STEP = 50;
const MIN_SCREEN_SPACING = 24;
const MAX_SCREEN_SPACING = 96;
const MAJOR_EVERY = 5;

const MINOR_COLOR = '#eceef1';
const MAJOR_COLOR = '#dcdfe4';
const AXIS_COLOR = '#c4c9d1';

/**
 * zoom 배율에 맞춰 world 격자 간격을 2배/절반으로 조정해 화면상 간격을
 * 일정 범위 안에 유지한다 — 어느 줌에서도 격자가 너무 촘촘하거나 성기지 않게.
 */
function resolveStep(scale: number): number {
  let step = BASE_STEP;
  while (step * scale < MIN_SCREEN_SPACING) step *= 2;
  while (step * scale > MAX_SCREEN_SPACING) step /= 2;
  return step;
}

function strokeLines(
  ctx: CanvasRenderingContext2D,
  lines: Array<[number, number, number, number]>,
  color: string,
): void {
  if (lines.length === 0) return;
  ctx.strokeStyle = color;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of lines) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  screenWidth: number,
  screenHeight: number,
): void {
  const step = resolveStep(viewport.scale);
  const bounds = getVisibleBounds(viewport, screenWidth, screenHeight);
  const startX = Math.floor(bounds.minX / step) * step;
  const startY = Math.floor(bounds.minY / step) * step;

  const minor: Array<[number, number, number, number]> = [];
  const major: Array<[number, number, number, number]> = [];
  const axis: Array<[number, number, number, number]> = [];

  for (let wx = startX; wx <= bounds.maxX; wx += step) {
    const sx = Math.round((wx - viewport.x) * viewport.scale) + 0.5;
    const line: [number, number, number, number] = [sx, 0, sx, screenHeight];
    if (wx === 0) axis.push(line);
    else if (Math.round(wx / step) % MAJOR_EVERY === 0) major.push(line);
    else minor.push(line);
  }
  for (let wy = startY; wy <= bounds.maxY; wy += step) {
    const sy = Math.round((wy - viewport.y) * viewport.scale) + 0.5;
    const line: [number, number, number, number] = [0, sy, screenWidth, sy];
    if (wy === 0) axis.push(line);
    else if (Math.round(wy / step) % MAJOR_EVERY === 0) major.push(line);
    else minor.push(line);
  }

  ctx.lineWidth = 1;
  strokeLines(ctx, minor, MINOR_COLOR);
  strokeLines(ctx, major, MAJOR_COLOR);
  strokeLines(ctx, axis, AXIS_COLOR);
}
