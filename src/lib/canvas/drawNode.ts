import type { CanvasNode, Viewport } from '@/types/canvas';
import { worldToScreen } from './transform';
import { getCachedImage } from './imageCache';
import { nodeProgress } from './animation';
import { getNodeColor } from './nodeColors';

const BORDER_SELECTED = '#2563eb';
const TEXT_CHECKED = '#94a3b8';
const IMAGE_PLACEHOLDER_FILL = '#f1f5f9';
const IMAGE_PLACEHOLDER_TEXT = '#94a3b8';
const CORNER_RADIUS = 10;
const LABEL_FONT_SIZE = 14;
const MIN_LABEL_FONT_SIZE = 6;

/** 체크박스 노드 안쪽 박스의 한 변(world 단위). 노드 좌측에 그려진다. */
export const CHECKBOX_SIZE = 16;
/** 체크박스 박스와 노드 좌측 가장자리 사이 여백(world 단위). */
export const CHECKBOX_PADDING = 12;
const CHECKBOX_BORDER = '#94a3b8';
const CHECKBOX_FILL_CHECKED = '#2563eb';

/** 노드 하나를 world→screen 변환해 둥근 사각형 + 라벨로 그린다. progress<1이면 등장 페이드+스케일. */
export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: CanvasNode,
  viewport: Viewport,
  selected: boolean,
  editing: boolean = false,
  progress: number = 1,
): void {
  const { scale } = viewport;
  const { x, y } = worldToScreen(viewport, node.x, node.y);
  const w = node.width * scale;
  const h = node.height * scale;
  const radius = Math.min(CORNER_RADIUS * scale, w / 2, h / 2);
  const isCheckbox = node.type === 'checkbox';
  const isChecked = isCheckbox && node.checked === true;
  const palette = getNodeColor(node);

  // 그래프 단위 progress(외부)와 노드 개별 spawn/remove progress 중 더 작은 값으로 합성.
  const individual = nodeProgress(Date.now(), node.spawnedAt, node.removingAt);
  const finalProgress = Math.min(progress, individual);
  const animating = finalProgress < 1;
  if (animating) {
    ctx.save();
    ctx.globalAlpha = finalProgress;
    // 중앙 기준 0.7→1.0 스케일. 페이드와 함께 "팝업" 느낌.
    const animScale = 0.7 + 0.3 * finalProgress;
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.translate(cx, cy);
    ctx.scale(animScale, animScale);
    ctx.translate(-cx, -cy);
  }

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = palette.fill;
  ctx.fill();
  ctx.lineWidth = selected ? 2 : 1;
  ctx.strokeStyle = selected ? BORDER_SELECTED : palette.border;
  ctx.stroke();

  if (node.type === 'image') {
    const img = node.imageUrl ? getCachedImage(node.imageUrl) : null;
    if (img) {
      // 둥근 사각형 안에 contain fit으로 이미지 그리기. clip으로 모서리를 둥글게 유지.
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.clip();
      const fit = Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const drawW = img.naturalWidth * fit;
      const drawH = img.naturalHeight * fit;
      ctx.drawImage(img, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
      ctx.restore();
    } else {
      // 로딩 중·imageUrl 없음 placeholder. 사각형 자체는 위에서 이미 그렸으니 회색 덧칠.
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fillStyle = IMAGE_PLACEHOLDER_FILL;
      ctx.fill();
      ctx.restore();
      const fontSize = LABEL_FONT_SIZE * scale;
      if (fontSize >= MIN_LABEL_FONT_SIZE) {
        ctx.fillStyle = IMAGE_PLACEHOLDER_TEXT;
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.imageUrl ? '이미지 로딩 중…' : '이미지 없음', x + w / 2, y + h / 2, w * 0.85);
      }
    }
  } else if (isCheckbox) {
    // 좌측에 체크박스 박스. 라벨 영역은 그만큼 좁아진다.
    const bx = x + CHECKBOX_PADDING * scale;
    const by = y + (h - CHECKBOX_SIZE * scale) / 2;
    const bs = CHECKBOX_SIZE * scale;
    const br = Math.min(3 * scale, bs / 2);
    ctx.beginPath();
    ctx.roundRect(bx, by, bs, bs, br);
    // 박스 자체는 노드 카테고리 색과 대비되도록 항상 흰색 베이스(checked 시 파랑 고정).
    ctx.fillStyle = isChecked ? CHECKBOX_FILL_CHECKED : '#ffffff';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isChecked ? CHECKBOX_FILL_CHECKED : CHECKBOX_BORDER;
    ctx.stroke();
    if (isChecked) {
      // ✓ 표시. 박스 안쪽에서 좌하단→중간→우상단으로 꺾이는 선.
      ctx.beginPath();
      ctx.moveTo(bx + bs * 0.25, by + bs * 0.55);
      ctx.lineTo(bx + bs * 0.45, by + bs * 0.75);
      ctx.lineTo(bx + bs * 0.78, by + bs * 0.3);
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  // 편집 중인 노드는 input 오버레이가 라벨을 대체하므로 캔버스에서 라벨을 그리지 않는다.
  // 이미지 노드는 이미지 자체가 식별 수단이라 라벨 표시는 생략한다(데이터로는 alt 용도로 유지).
  if (!editing && node.type !== 'image') {
    // 너무 작게 줌아웃되면 글자가 뭉개지므로 라벨은 생략한다.
    const fontSize = LABEL_FONT_SIZE * scale;
    if (fontSize >= MIN_LABEL_FONT_SIZE) {
      ctx.fillStyle = isChecked ? TEXT_CHECKED : palette.text;
      ctx.font = `${fontSize}px system-ui, sans-serif`;
      ctx.textBaseline = 'middle';
      if (isCheckbox) {
        // 체크박스 옆 라벨은 박스 우측부터 우측 padding까지 좌측 정렬.
        const labelLeft = x + (CHECKBOX_PADDING + CHECKBOX_SIZE + 8) * scale;
        const labelMaxWidth = x + w - labelLeft - 12 * scale;
        ctx.textAlign = 'left';
        ctx.fillText(node.label, labelLeft, y + h / 2, labelMaxWidth);
        if (isChecked) {
          // strikethrough 선
          const metrics = ctx.measureText(node.label);
          const lineWidth = Math.min(metrics.width, labelMaxWidth);
          ctx.beginPath();
          ctx.moveTo(labelLeft, y + h / 2);
          ctx.lineTo(labelLeft + lineWidth, y + h / 2);
          ctx.lineWidth = Math.max(1, scale);
          ctx.strokeStyle = TEXT_CHECKED;
          ctx.stroke();
        }
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x + w / 2, y + h / 2, w * 0.85);
      }
    }
  }

  if (animating) ctx.restore();
}
