# MindCanvas

> AI로 초안을 만들고 여러 명이 실시간으로 함께 편집하는 마인드맵 / 플로우 차트 SaaS.

[mind-canvas-green.vercel.app](https://mind-canvas-green.vercel.app)

---

## 프로젝트 소개

한 문장만 입력하면 Gemini가 마인드맵 초안을 생성하고, 그 결과를 무한 캔버스 위에서
여러 사용자가 동시에 편집·이동·확대할 수 있는 협업 도구다.

- **AI 초안 생성** — 주제를 입력하면 노드·엣지 구조를 자동 생성
- **실시간 협업** — Y.js CRDT 기반 멀티커서·노드 편집 잠금·이름 라벨
- **무한 캔버스** — HTML5 Canvas 직접 렌더링, 1만 노드 합성 벤치마크에서 인터랙션 중 60fps 유지
- **오프라인 영속** — IndexedDB에 로컬 저장, 재접속 시 자동 동기화
- **공유·임베드** — view-only / edit 링크, iframe 임베드 SDK, 동적 OG 이미지

협업·렌더링·배포 전 영역을 한 사람이 다루는 단일 프로젝트로, 1만 노드 성능 최적화와
무료 티어 배포 토폴로지 설계에 비중을 두었다.

---

## 아키텍처

```text
┌────────────────────────────┐        ┌──────────────────────────┐
│  Browser (PWA)             │        │  Vercel                  │
│                            │        │  Next.js App Router       │
│  HTML5 Canvas 렌더 ◀──────┐│ HTTPS  │   ├ /canvas  UI           │
│  Zustand ◀─ Y.Map (CRDT)  ││───────▶│   ├ /api/ai-generate ─────┼──▶ Gemini API
│  y-indexeddb (오프라인)    ││        │   └ /api/cron (keep-alive)│
└──────────┬─────────────────┘        └────────────┬─────────────┘
           │ WebSocket (wss)                        │ SSR · Auth
           ▼                                        ▼
┌────────────────────────────┐        ┌──────────────────────────┐
│  Render (free web service) │        │  Supabase                │
│  Y.js WebSocket 릴레이      │        │  Postgres + RLS · Auth    │
│  scripts/yjs-server.mjs    │        │  share token 기반 권한     │
└────────────────────────────┘        └──────────────────────────┘
```

- **Next 앱은 Vercel, Y.js WebSocket 릴레이만 Render**에 분리 배포한다. 릴레이는 ws만
  쓰므로 빌드 스크립트를 건너뛰고(`--ignore-scripts`) 콜드스타트만 감수한다.
- 캔버스 상태는 **Zustand 스토어를 Y.Map 위에 얹어** 로컬 반응성과 CRDT 동기화를 분리.
- 공유 권한은 Supabase **RLS + share token**으로 처리해 익명 사용자도 토큰 범위 내에서만
  읽기/편집하도록 제한한다.

소스 구조: `src/lib/canvas`(렌더·뷰포트), `src/lib/yjs`(협업), `src/lib/supabase`(인증·저장),
`src/lib/ai`(Gemini), `src/stores`(Zustand), `src/components/canvas`(캔버스 UI).

---

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) · React 19 · TypeScript |
| 렌더링 | HTML5 Canvas 직접 렌더 · d3-force (force layout) |
| 상태 | Zustand (Y.Map 백킹) |
| 실시간 협업 | Y.js · y-websocket · y-protocols · y-indexeddb |
| 백엔드 | Supabase (Postgres · Auth · RLS) |
| AI | Google Gemini (`@google/generative-ai`) |
| 스타일 | Tailwind CSS v4 · lucide-react |
| 국제화 | next-intl (한·영·일) |
| 검증 | Zod · ESLint · Playwright (E2E) · Lighthouse CI |
| 배포 | Vercel (앱) · Render (Y.js 릴레이) · Docker Compose (로컬) |

---

## 핵심 기능

- **AI 마인드맵 생성** — 주제 한 줄 → Gemini가 노드·엣지 구조 생성
- **무한 캔버스** — pan / zoom, 뷰포트 컬링, 미니맵 클릭·드래그 이동
- **실시간 협업** — 멀티커서·이름 라벨, 노드 편집 잠금(awareness broadcast)
- **공유 & 권한** — view-only / edit 공유 링크, share token 기반 RLS
- **임베드 SDK** — `data` 속성으로 iframe 자동 생성, 동적 OG 이미지
- **오프라인 / PWA** — y-indexeddb 영속, manifest·Service Worker
- **모바일** — one-finger pan + two-finger pinch zoom 터치 제스처
- **접근성 · 테마** — 다크/라이트/시스템 토글, `prefers-reduced-motion` 존중, 폼·다이얼로그 키보드 조작

---

## 대표 트러블슈팅

### 1. 1만 노드 캔버스 60fps — 측정 기반 뷰포트 컬링

- **문제** — 노드·엣지가 각 1만 개일 때 pan/zoom 도중 전체 그래프를 매 프레임 다시
  그려 프레임이 끊겼다.
- **접근** — 먼저 추측 대신 측정. FPS 카운터(`useFps`)와 1만 노드 일괄 생성 dev
  도구(`seedTestGraph`)를 직접 구현해 병목을 화면 밖 객체의 그리기 호출로 특정했다.
- **해결** — 렌더 직전 뷰포트 world 영역을 한 번 계산하고, 각 노드·엣지의 경계 사각형이
  교차할 때만 그리도록 컬링([viewport.ts](src/lib/canvas/viewport.ts)). 엣지는 베지어
  곡선의 정확한 bound 대신 **양 끝 노드를 포함하는 사각형으로 근사**해 비용을 낮췄다.
  `nodes 보임/전체` HUD를 띄워 화면 밖 객체가 실제로 제외되는지 실시간 검증.
- **결과** — 매 프레임 전체 그래프를 다시 그리던 pan/zoom·드래그 인터랙션 중에도
  **60fps 이상 유지**(측정 67fps), 인터랙션이 끝나면 모니터 상한(144Hz)으로 복귀해
  누적 부담이 없음을 `useFps` HUD로 확인. [이슈 #19](https://github.com/mulddang2/mindcanvas/issues/19) 목표 충족.

### 2. 실시간 멀티커서 — 원격 이벤트 RAF 쓰로틀링

- **문제** — 원격 커서 awareness 갱신 이벤트가 빈번해 수신 측 리렌더가 메인 스레드를
  압박했다.
- **해결** — 대량의 커서 갱신을 `requestAnimationFrame`으로 묶어 **프레임당 1회**로
  제한([#79](https://github.com/mulddang2/mindcanvas/pull/79)). 이동량이 사람 눈에 손실 없이 갱신 빈도만 프레임 예산에 맞췄다.
- **결과** — 다중 커서 환경에서도 렌더 주기가 프레임당 1회로 안착.

### 3. 무료 티어 배포 — Vercel + Render 분리와 pnpm 핀

- **문제** — Y.js WebSocket은 Vercel 서버리스에서 상시 연결을 유지하기 어렵고, Render
  무료 플랜 빌드가 corepack의 pnpm 버전 드리프트로 깨졌다.
- **해결** — **Next 앱은 Vercel, Y.js 릴레이만 Render**로 분리하고 릴레이 빌드는
  `--ignore-scripts`로 불필요한 의존성 빌드·husky를 건너뛰도록 했다. 빌드 버전 드리프트는
  `package.json`의 `packageManager: pnpm@10.11.0` 핀으로 고정([#87](https://github.com/mulddang2/mindcanvas/pull/87)). 무료 티어 7일
  무활동 정지는 cron keep-alive로 방지([#90](https://github.com/mulddang2/mindcanvas/pull/90)).
- **결과** — 무료 인프라만으로 SSR·실시간 협업·DB를 모두 운영.

---

## 로컬 실행

`.env.local.example`을 복사해 `.env.local`을 만들고 키를 채운다.

```bash
cp .env.local.example .env.local
```

| 키 | 용도 |
|---|---|
| `GEMINI_API_KEY` | AI 마인드맵 생성 |
| `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 인증·저장 |
| `NEXT_PUBLIC_YJS_WS_URL` | 협업 WebSocket (로컬 기본 `ws://localhost:1234`) |

```bash
pnpm install
pnpm dev   # next dev + yjs WebSocket 동시 기동 → http://localhost:3000
```

Docker Compose로도 띄울 수 있다(next 3000 + yjs 1234).

```bash
docker compose up --build
```

커밋 컨벤션은 [docs/commit-convention.md](docs/commit-convention.md) 참고.
