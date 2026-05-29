// MindCanvas 임베드 SDK — 외부 사이트에서 <script src="..."></script> 로드 시
// data-mindcanvas-token 속성을 가진 모든 요소를 찾아 iframe으로 변환한다.
//
// 사용 예:
//   <div data-mindcanvas-token="abc123" style="width:600px;height:400px"></div>
//   <script src="https://mindcanvas.app/embed.js" defer></script>
(function () {
  if (typeof document === 'undefined') return;

  // 스크립트가 호스팅된 origin을 추출 — 같은 origin의 /embed/[token] 라우트로 iframe src 설정.
  function getOrigin() {
    var current = document.currentScript;
    if (current && current.src) {
      try {
        return new URL(current.src).origin;
      } catch (_) {
        // 폴백
      }
    }
    return window.location.origin;
  }

  function mount(el, origin) {
    if (el.dataset.mindcanvasMounted === '1') return;
    var token = el.dataset.mindcanvasToken;
    if (!token) return;
    el.dataset.mindcanvasMounted = '1';

    var iframe = document.createElement('iframe');
    iframe.src = origin + '/embed/' + encodeURIComponent(token);
    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block';
    iframe.title = 'MindCanvas';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer';
    iframe.allow = 'fullscreen';
    el.appendChild(iframe);
  }

  function mountAll() {
    var origin = getOrigin();
    var els = document.querySelectorAll('[data-mindcanvas-token]');
    for (var i = 0; i < els.length; i++) mount(els[i], origin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll, { once: true });
  } else {
    mountAll();
  }
})();
