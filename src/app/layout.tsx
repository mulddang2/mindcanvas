import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'MindCanvas',
  description: 'AI 협업 마인드맵 / 플로우 차트 SaaS',
  manifest: '/manifest.json',
  applicationName: 'MindCanvas',
  appleWebApp: { capable: true, title: 'MindCanvas', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#1f2933',
  width: 'device-width',
  initialScale: 1,
  // 캔버스 핀치 줌과 충돌하지 않게 페이지 자체 줌은 잠금.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        {/* Service Worker 등록 — production에서만 활성, dev는 HMR과 충돌 방지를 위해 skip. */}
        {process.env.NODE_ENV === 'production' && (
          <Script id="sw-register" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
