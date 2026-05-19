# MindCanvas

AI 협업 마인드맵 / 플로우 차트 SaaS.

---

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/) 기반. `type` · `scope`는 영어, `subject`는 한국어 명사형.

### 포맷

```text
<type>(<scope>): <subject>

<body>    ← 선택, 한 줄 100자

<footer>  ← 선택, GitHub 키워드 (Closes #N)
```

### 예시

```text
feat(canvas): 무한 줌 인터랙션 추가
fix(node): 드래그 시 좌표 누적 오차 수정
docs: 커밋 컨벤션 리서치 정리
chore(deps): zustand 5.0.2로 업데이트
```

### type

| type | 의미 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 |
| `style` | 포맷 (코드 동작 변경 없음) |
| `refactor` | 리팩토링 (기능 변경 없음) |
| `perf` | 성능 개선 |
| `test` | 테스트 |
| `build` | 빌드 / 의존성 |
| `ci` | CI 설정 |
| `chore` | 잡일 |
| `revert` | 되돌리기 |

### scope

| scope | 영역 |
|---|---|
| `canvas` | 무한 캔버스 엔진 |
| `node` | 노드 시스템 |
| `edge` | 엣지 / 연결선 |
| `layout` | D3 force layout |
| `store` | Zustand |
| `ai` | Gemini |
| `auth` | Supabase Auth |
| `collab` | Y.js 협업 |
| `mobile` | PWA · 터치 |
| `embed` | 임베드 SDK |
| `ui` | 공통 UI |
| `hooks` | 커스텀 훅 |
| `a11y` | 접근성 |
| `i18n` | 다국어 |
| `perf` | 성능 측정 |
| `deps` | 의존성 |

### 검증 규칙

- header 72자 이내, body 한 줄 100자 이내
- `subject`는 한국어 명사형 종결 (`~ 추가`, `~ 수정`)
- `husky` + `commitlint`가 `commit-msg` hook에서 자동 검증
- `--no-verify`로 검증 우회 금지
