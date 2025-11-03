# Resecof (React Server Component Framework)

> https://github.com/JSerZANP/demystify-react-server-components

## 1주차 — 최소 RSC 파이프라인(E2E)

**목표**

- 서버: `renderToRSCStream`으로 Flight 스트림 생성 (renderToPipeableStream 모방 구현)
- 클라이언트: `fetchRSC` + `useState`로 점진 복원 (createFromFetch 모방 구현)
- 직접 라우팅: `/`, `/about`, `/home` (Accept 헤더로 HTML/RSC 구분)

**할 일**

- `server/entry.ts`(Express) + `server/rsc-renderer.ts` + `shared/App.server.tsx` + `client/main.tsx` + `client/rsc-client.ts`
- `"use client"` 컴포넌트 1개 연결(상태 변화 확인용 Counter)
- 에러/콘텐트 타입(`text/x-component`) 세팅
- Accept 헤더 기반 HTML/RSC 요청 구분

**완료 기준**

- `Home/About` 버튼 전환 시 RSC 페이로드가 스트리밍으로 화면에 그려짐
- SSR 없이도(순수 RSC 복원) 첫 렌더 성공
- 브라우저 주소창에 직접 경로 입력 시 정상 동작 (`/`, `/about`, `/home`)
- 클라이언트 컴포넌트(Counter)의 상태 변화 확인 가능

---

## 2주차 — 번들링 & 경계 & 파일 라우팅

**목표**

- **서버/클라 번들 분리** + **매니페스트** 생성
- **파일 기반 라우터**: `app/(route)/page.server.tsx` 인식 → location 매핑

**할 일**

- esbuild(or webpack) 2개 타겟:
  - `.server.*`만 포함하는 서버 번들
  - `"use client"`/`.client.*`만 포함하는 클라 번들
- 빌드시 **클라이언트 매니페스트(JSON)** 생성(모듈ID→정적자원 URL)
- 라우터: `app/home/page.server.tsx` → `/`, `app/about/page.server.tsx` → `/about`
- 정적 서빙(`dist/public`) + 캐시 헤더 기본값

**완료 기준**

- 파일 추가만으로 새 라우트가 자동 반영
- 서버 렌더 로그에 “클라 모듈 해상→URL” 매핑 확인

---

## 3주차 — 데이터 패칭, Suspense 스트리밍, 캐시, 에러

**목표**

- 서버 컴포넌트에서 DB/외부 API 접근
- `Suspense` 경계로 **부분 스트리밍**
- **Flight 응답 캐시**(location+params 키)
- 오류/경계 처리(서버 오류 → 친화적 페일오버 UI)

**할 일**

- `getPost(id)` 같은 비동기 소스 두세 개 도입(가짜 지연 포함)
- `Suspense` + 대체 UI + 에러 바운더리
- 60초 메모리 캐시(LRU) → 재요청 단축
- 로깅: 요청 ID, 스트림 청크 타임스탬프

**완료 기준**

- 느린 섹션은 스켈레톤/placeholder 먼저 보이고 뒤이어 본문 스트리밍
- 동일 location 재요청 시 TTFB/총 시간 단축 확인

---

## 4주차 — 서버 액션, DX(HMR/오버레이), 프로덕션 빌드

**목표**

- **서버 액션**(폼/뮤테이션) 스타일 도입
- **Dev DX**: HMR(클라), 서버 자동 재빌드, 에러 오버레이
- 프로덕션 빌드/런북/벤치마크

**할 일**

- `actions/like.ts` 등 서버 함수 → 폼 `action`으로 호출
- dev 서버: 파일 변경 감지 → 클라 HMR, 서버 재시작(초경량)
- 빌드 스크립트: `dev / build / start`
- 간단한 벤치: 첫 바이트까지 시간, 전체 스트림 완료 시간 기록

**완료 기준**

- 폼 전송이 전역 상태 리프레시 없이 서버에서 반영
- `npm run build && npm start`로 프로덕션 실행 가능
- README에 사용법/제약/버전 고정 전략 문서화

---

## 1주차 실제 구현 구조

```
resecof/
  server/
    entry.ts              # Express 서버 + 라우팅 + HTML/RSC 구분
    rsc-renderer.ts       # RSC 렌더러 (Flight 프로토콜 구현)
  shared/
    App.server.tsx        # 서버 컴포넌트 (Home/About 페이지)
    Counter.client.tsx    # 클라이언트 컴포넌트 (상태 관리 예제)
  client/
    main.tsx              # 클라이언트 엔트리 (라우팅 + 렌더링)
    rsc-client.ts         # RSC 클라이언트 (스트림 파싱 + 복원)
  scripts/
    build.mjs             # 빌드 스크립트 (esbuild)
  dist/                   # 빌드된 서버 코드
    server/
      entry.js
      rsc-renderer.js
    shared/
      App.server.js
      Counter.client.js
  public/                 # 빌드된 클라이언트 코드
    client.js
  tsconfig.json
  package.json
```

## 제안하는 폴더 구조 (2주차 이후)

```
resecof/
  app/
    home/page.server.tsx
    about/page.server.tsx
  client/
    main.tsx
  server/
    entry.ts
  shared/
    Header.server.tsx
    LikeButton.client.tsx
  actions/
    like.ts
  build/
    manifest.ts           # 모듈ID→URL 매핑 생성기
  dist/
    public/               # 클라 정적물
    react-client-manifest.json
  package.json

```

## 1주차 스크립트 (실제 구현)

```json
{
  "scripts": {
    "dev": "npm run build && node dist/server/entry.js",
    "build": "node scripts/build.mjs"
  }
}
```

빌드 스크립트(`scripts/build.mjs`)에서:

- 클라이언트 번들: `client/main.tsx` → `public/client.js` (ESM, 모든 의존성 포함)
- 서버 트랜스파일: `server/`, `shared/` → `dist/` (ESM, packages external)

## 스크립트 예시 (2주차 이후 목표)

```json
{
  "scripts": {
    "dev": "run-p dev:*",
    "dev:server": "nodemon --watch dist --exec node dist/server.js",
    "dev:build": "run-p watch:*",
    "watch:server": "esbuild server/entry.ts --platform=node --bundle --outfile=dist/server.js --watch",
    "watch:client": "esbuild client/main.tsx --bundle --outfile=dist/public/client.js --splitting --format=esm --watch",
    "build": "npm run build:server && npm run build:client && node build/manifest.js",
    "build:server": "esbuild server/entry.ts --platform=node --bundle --minify --outfile=dist/server.js",
    "build:client": "esbuild client/main.tsx --bundle --format=esm --splitting --minify --outdir=dist/public",
    "start": "NODE_ENV=production node dist/server.js"
  }
}
```

## 1주차 구현 세부사항

### 구현 방식

- **직접 구현**: `react-server-dom-webpack` 대신 Flight 프로토콜을 직접 구현
- **renderToRSCStream**: `renderToPipeableStream`을 모방하여 구현한 RSC 렌더러 (`server/rsc-renderer.ts`)
- **fetchRSC**: `createFromFetch`를 모방하여 구현한 RSC 클라이언트 (`client/rsc-client.ts`)
- **라우팅**: Accept 헤더로 HTML 요청과 RSC 요청을 구분

### 주요 특징

- **Accept 헤더 기반 요청 구분**

  - 브라우저 직접 접속: `Accept: text/html` → HTML 페이지 반환
  - JavaScript fetch: `Accept: text/x-component` → RSC 스트림 반환

- **직접 라우팅**

  - `/`, `/about`, `/home` 라우트 정의
  - 브라우저 주소창에 직접 입력 가능
  - 뒤로가기/앞으로가기 지원 (`popstate` 이벤트)

- **클라이언트 컴포넌트 레지스트리**
  - 전역 객체(`window.__CLIENT_COMPONENTS__`)에 컴포넌트 등록
  - 서버에서 `$ClientComponent`로 마킹된 컴포넌트를 클라이언트에서 로드

## 버전/주의사항 (2주차 이후)

- `react`, `react-dom`, `react-server-dom-webpack`는 **서로 호환되는 버전**으로 핀 고정(예: 동일 canary 라인).
- 서버에서 `renderToPipeableStream(..., clientManifest)`에 **클라 매니페스트** 정확히 주입.
- `"use client"` 경계는 파일 상단에 정확히 배치(트랜스파일 전 기준).
