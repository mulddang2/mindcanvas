import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { I18nProvider } from '@/components/i18n/I18nProvider';

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
      <head>
        {/* FOUC 방지 — hydration 전에 localStorage의 사용자 선호값으로 <html>에 'dark' 클래스 적용. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('mindcanvas:theme');var v=s?(JSON.parse(s).state||{}).preference:'system';var od=window.matchMedia('(prefers-color-scheme: dark)').matches;if(v==='dark'||(v==='system'&&od))document.documentElement.classList.add('dark');}catch(_){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
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
