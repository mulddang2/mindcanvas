import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Home() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <ThemeToggle />
      <h1 className="text-fg text-4xl font-semibold">MindCanvas</h1>
      <p className="text-fg-muted max-w-md text-sm">
        AI 협업 마인드맵 / 플로우 차트 SaaS. 무한 캔버스에서 Pan·Zoom을 시험해 보세요.
      </p>
      <Link
        href="/canvas/demo"
        className="bg-brand text-brand-fg hover:bg-brand-hover rounded-md px-5 py-2.5 text-sm font-medium transition-colors"
      >
        캔버스 열기
      </Link>
    </main>
  );
}
