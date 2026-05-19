import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MindCanvas',
  description: 'AI 협업 마인드맵 / 플로우 차트 SaaS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
