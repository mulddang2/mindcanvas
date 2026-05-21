import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-semibold">MindCanvas</h1>
      <p className="max-w-md text-sm text-neutral-500">
        AI 협업 마인드맵 / 플로우 차트 SaaS. 무한 캔버스에서 Pan·Zoom을 시험해 보세요.
      </p>
      <Link
        href="/canvas/demo"
        className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
      >
        캔버스 열기
      </Link>
    </main>
  );
}
