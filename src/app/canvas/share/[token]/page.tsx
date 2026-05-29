import { notFound } from 'next/navigation';
import { createShareClient } from '@/lib/supabase/shareServer';
import { CanvasView } from '../../[id]/CanvasView';
import type { CanvasGraph } from '@/lib/supabase/canvases';

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

  // share_role이 'edit'인 토큰은 본 PR 미지원 — 일단 모두 view-only로 처리.
  return (
    <CanvasView
      canvasId={data.id}
      title={data.title}
      initialGraph={data.data as CanvasGraph}
      role="view"
    />
  );
}
