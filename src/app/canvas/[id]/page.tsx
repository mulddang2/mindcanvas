import { notFound } from 'next/navigation';
import type { Viewport } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CanvasView } from './CanvasView';
import { EMPTY_GRAPH, type CanvasGraph } from '@/lib/supabase/canvases';

// 캔버스 페이지에서만 페이지 자체 줌을 잠근다 — 핀치 줌이 캔버스 줌과 충돌하지 않도록.
// 랜딩·로그인 등은 root layout의 viewport를 그대로 써서 접근성 줌 허용.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface Props {
  params: Promise<{ id: string }>;
}

/** 캔버스 진입 — id가 'demo'면 임시 모드, UUID면 DB에서 로드해 클라이언트 컴포넌트에 hydrate한다. */
export default async function CanvasPage({ params }: Props) {
  const { id } = await params;

  if (id === 'demo') {
    return (
      <CanvasView canvasId="demo" title="데모" initialGraph={EMPTY_GRAPH} demo />
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('canvases')
    .select('id, title, data')
    .eq('id', id)
    .maybeSingle();

  // RLS로 owner_id 자동 필터링 — 본인 소유가 아니면 data가 null로 돌아온다.
  if (error || !data) {
    notFound();
  }

  return (
    <CanvasView
      canvasId={data.id}
      title={data.title}
      initialGraph={data.data as CanvasGraph}
    />
  );
}
