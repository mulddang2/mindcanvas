import { notFound } from 'next/navigation';
import type { Viewport } from 'next';
import { createShareClient } from '@/lib/supabase/shareServer';
import { CanvasView } from '../../canvas/[id]/CanvasView';
import type { CanvasGraph } from '@/lib/supabase/canvases';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface Props {
  params: Promise<{ token: string }>;
}

/**
 * iframe 임베드 진입 — share token으로 캔버스 조회 + 최소화 UI 모드.
 * 캔버스·미니맵·멀티커서·우클릭 메뉴는 그대로, toolbar·AI 입력·타이틀바·사용자 메뉴는 숨김.
 * share_role 따라 view/edit 권한 적용.
 */
export default async function EmbedCanvasPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createShareClient(token);
  const { data, error } = await supabase
    .from('canvases')
    .select('id, title, data, share_role')
    .eq('share_token', token)
    .maybeSingle();

  if (error || !data) notFound();

  return (
    <CanvasView
      canvasId={data.id}
      title={data.title}
      initialGraph={data.data as CanvasGraph}
      role={data.share_role ?? 'view'}
      shareToken={token}
      embed
    />
  );
}
