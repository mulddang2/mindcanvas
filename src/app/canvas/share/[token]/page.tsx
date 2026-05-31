import { notFound } from 'next/navigation';
import type { Viewport } from 'next';
import { createShareClient } from '@/lib/supabase/shareServer';
import { CanvasView } from '../../[id]/CanvasView';
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
 * 공유 링크 진입 — share_token으로 캔버스를 조회한다. RLS의 share_token select 정책이
 * 토큰 일치 row 1개만 노출하므로 본인 소유 여부와 무관하게 접근 가능. 권한은 share_role 기반.
 */
export default async function SharedCanvasPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createShareClient(token);
  const { data, error } = await supabase
    .from('canvases')
    .select('id, title, data, share_role')
    .eq('share_token', token)
    .maybeSingle();

  if (error || !data) notFound();

  // share_role을 그대로 적용. 'edit'면 클라이언트가 token 헤더를 자동 주입해 RLS UPDATE 통과.
  return (
    <CanvasView
      canvasId={data.id}
      title={data.title}
      initialGraph={data.data as CanvasGraph}
      role={data.share_role ?? 'view'}
      shareToken={token}
    />
  );
}
