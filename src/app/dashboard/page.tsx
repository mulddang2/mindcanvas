import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { CanvasSummary } from '@/lib/supabase/canvases';
import { DashboardActions } from './DashboardActions';

/** 내 마인드맵 목록 페이지. 서버에서 owner_id로 필터링한 캔버스 목록을 불러와 카드로 표시. */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('canvases')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false });

  const canvases: CanvasSummary[] = error ? [] : data ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">내 마인드맵</h1>
        <DashboardActions />
      </div>

      {canvases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 px-6 py-16 text-center">
          <p className="mb-4 text-sm text-neutral-500">아직 만든 마인드맵이 없습니다.</p>
          <DashboardActions variant="empty" />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canvases.map((canvas) => (
            <li key={canvas.id}>
              <CanvasCard canvas={canvas} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function CanvasCard({ canvas }: { canvas: CanvasSummary }) {
  return (
    <div className="group relative rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md">
      <Link href={`/canvas/${canvas.id}`} className="block">
        <div className="mb-1 truncate text-base font-medium text-neutral-900">{canvas.title}</div>
        <div className="text-xs text-neutral-500">
          {new Date(canvas.updated_at).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </Link>
      <DashboardActions variant="card" canvasId={canvas.id} canvasTitle={canvas.title} />
    </div>
  );
}
