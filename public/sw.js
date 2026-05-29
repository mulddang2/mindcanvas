// MindCanvas 기본 Service Worker — 핵심 정적 asset만 캐싱한다.
// 동적 Y.js 동기화·Supabase API 호출은 캐시 대상 아님 (network 통과).
// dev/HMR 환경에서는 register 측에서 차단해 SW가 활성 안 됨.

const CACHE_NAME = 'mindcanvas-v1';
const CORE_ASSETS = ['/', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 같은 origin의 GET만 캐시 대상.
  if (url.origin !== self.location.origin) return;
  // API·동기화 경로는 network 통과(stale 위험).
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // 정적 asset만 캐시에 저장 (200 OK + basic type).
          if (res.ok && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached ?? Response.error());
    }),
  );
});
