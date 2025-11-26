# Resecof (React Server Component Framework)

> https://github.com/JSerZANP/demystify-react-server-components

## 1주차 — 최소 RSC 파이프라인(E2E) ✅

**목표**

- 서버: `renderToRSCStream`으로 Flight 스트림 생성 (renderToPipeableStream 모방 구현)
- 클라이언트: `fetchRSC` + `useState`로 점진 복원 (createFromFetch 모방 구현)
- 직접 라우팅: `/`, `/about`, `/home` (Accept 헤더로 HTML/RSC 구분)

**완료 사항**

- ✅ Express 서버 + RSC 엔드포인트 구현
- ✅ Flight 프로토콜 직접 구현 (`renderToRSCStream`)
- ✅ RSC 클라이언트 구현 (`fetchRSC`)
- ✅ 서버/클라이언트 컴포넌트 분리
- ✅ 라우팅 시스템 (Accept 헤더 기반)
- ✅ 클라이언트 컴포넌트 레지스트리
- ✅ `"use client"` 컴포넌트 연결 (Counter)

**완료 기준**

- ✅ `Home/About` 버튼 전환 시 RSC 페이로드가 스트리밍으로 화면에 그려짐
- ✅ SSR 없이도(순수 RSC 복원) 첫 렌더 성공
- ✅ 브라우저 주소창에 직접 경로 입력 시 정상 동작 (`/`, `/about`, `/home`)
- ✅ 클라이언트 컴포넌트(Counter)의 상태 변화 확인 가능

---

## 2주차 — 번들링 & 경계 & 파일 라우팅 ✅

**목표**

- **서버/클라 번들 분리** + **매니페스트** 생성
- **파일 기반 라우터**: `src/pages/(route)/page.tsx` 인식 → location 매핑
- **디렉토리 구조 정리**: `src/` 루트 구조로 통합
- **코드 리팩토링**: 엔드포인트와 비즈니스 로직 분리

**완료 사항**

- ✅ esbuild로 서버/클라이언트 번들 분리
- ✅ 클라이언트 매니페스트 생성 (모듈ID → 정적자원 URL)
- ✅ 파일 기반 라우터 구현 (`src/pages/*/page.tsx`)
- ✅ 클라이언트 컴포넌트 import 에러 처리 (가짜 모듈 생성)
- ✅ 디렉토리 구조 정리 (`client/` 제거, `src/` 구조로 통합)
- ✅ 코드 리팩토링 (`src/utils/`로 분리)

**완료 기준**

- ✅ 파일 추가만으로 새 라우트가 자동 반영
- ✅ 서버/클라이언트 번들 분리 완료
- ✅ 클라이언트 매니페스트 생성 및 활용

---

## 3주차 — 데이터 패칭, Suspense 스트리밍, 캐시 ✅

**목표**

- 서버 컴포넌트에서 DB/외부 API 접근
- `Suspense` 경계로 **부분 스트리밍**
- **Flight 응답 캐시**(location+params 키)
- 오류/경계 처리(서버 오류 → 친화적 페일오버 UI)

**완료 사항**

- ✅ 서버 컴포넌트에서 비동기 데이터 페칭 (`getPost`, `getPosts`)
- ✅ React Suspense 메커니즘을 활용한 스트리밍 구현
- ✅ SuspenseContent 컴포넌트 단순화 (setInterval 제거)
- ✅ RSC 페이로드 캐싱 로직 개선 (중복 API 호출 방지)
- ✅ 서버 컴포넌트 중첩 구조 처리
- ✅ 로딩 스피너 표시 개선

**완료 기준**

- ✅ 느린 섹션은 스켈레톤/placeholder 먼저 보이고 뒤이어 본문 스트리밍
- ✅ 동일 location 재요청 시 중복 API 호출 방지
- ✅ 이미 페칭된 페이지 재방문 시 정상적으로 재렌더링

---

## 4주차 — 서버 액션, DX(HMR/오버레이), 프로덕션 빌드 ✅

**목표**

- **서버 액션**(폼/뮤테이션) 스타일 도입
- **Dev DX**: HMR(클라), 서버 자동 재빌드, 에러 오버레이
- 프로덕션 빌드/런북/벤치마크

**완료 사항**

- ✅ 서버 액션 구현 (`actions/like.ts` 등 서버 함수 → 폼 `action`으로 호출)
- ✅ 개발 서버: 파일 변경 감지 → 클라 HMR, 서버 재시작(초경량)
- ✅ 빌드 스크립트: `dev / build / start`
- ✅ 서버 액션 클라이언트/서버 유틸리티 구현
- ✅ HMR WebSocket 서버/클라이언트 구현
- ✅ LikeButton 컴포넌트를 통한 서버 액션 사용 예시

**완료 기준**

- ✅ 폼 전송이 전역 상태 리프레시 없이 서버에서 반영
- ✅ `npm run build && npm start`로 프로덕션 실행 가능
- ✅ 파일 변경 시 자동 빌드 및 재시작
- ✅ HMR을 통한 자동 리로드

---

## 빌드 및 실행

### 스크립트

```json
{
  "scripts": {
    "dev": "node scripts/dev-server.mjs",
    "build": "rm -rf dist && node scripts/build.mjs",
    "start": "node dist/server/index.js"
  }
}
```

**스크립트 설명:**

- `npm run dev`: 개발 서버 시작 (파일 변경 감지, 자동 빌드, HMR 지원)
- `npm run build`: 프로덕션 빌드 실행
- `npm start`: 프로덕션 서버 실행

### 빌드 프로세스

빌드 스크립트(`scripts/build.mjs`)에서:

1. **클라이언트 번들 생성**

   - 엔트리: `src/main.tsx`
   - 출력: `dist/public/main.js`
   - 플랫폼: `browser`
   - 코드 스플리팅 활성화
   - `src/server/` 디렉토리 제외

2. **클라이언트 매니페스트 생성**

   - 모듈 ID → 정적 자원 URL 매핑
   - `dist/react-client-manifest.json` 저장

3. **페이지 컴포넌트 트랜스파일**

   - `src/pages/*/page.tsx` → `dist/pages/*/page.js`
   - 서버에서 동적 import로 로드

4. **서버 번들 생성**
   - 엔트리: `src/server/index.ts`
   - 출력: `dist/server/index.js`
   - 플랫폼: `node`
   - `src/components/` 디렉토리 제외 (클라이언트 컴포넌트)

### 실행 방법

#### 개발 모드

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 시작 (자동 빌드 + HMR)
npm run dev
```

개발 서버는 다음 기능을 제공합니다:

- 파일 변경 자동 감지 (`chokidar`)
- 자동 빌드 및 서버 재시작
- HMR (Hot Module Replacement) 지원
- WebSocket을 통한 실시간 알림

서버는 `http://localhost:3000`에서 실행되고, WebSocket 서버는 `ws://localhost:3001`에서 실행됩니다.

#### 프로덕션 모드

```bash
# 1. 의존성 설치
npm install

# 2. 빌드
npm run build

# 3. 서버 실행
npm start
```

프로덕션 서버는 `http://localhost:3000`에서 실행됩니다.

## 구현 세부사항

### 구현 방식

- **직접 구현**: `react-server-dom-webpack` 대신 Flight 프로토콜을 직접 구현
- **renderToRSCStream**: `renderToPipeableStream`을 모방하여 구현한 RSC 렌더러 (`src/utils/rsc-renderer.ts`)
- **fetchRSC**: `createFromFetch`를 모방하여 구현한 RSC 클라이언트 (`src/utils/rsc-client.ts`)
- **파일 기반 라우팅**: `src/pages/*/page.tsx` 파일을 스캔하여 자동으로 라우트 생성

### 주요 특징

#### 1주차

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

#### 2주차

- **서버/클라이언트 번들 분리**

  - esbuild로 서버와 클라이언트 번들 완전 분리
  - 플러그인으로 cross-bundle import 제외

- **클라이언트 매니페스트**

  - 빌드 시 모듈 ID → 정적 자원 URL 매핑 생성
  - 서버에서 클라이언트 컴포넌트 URL 해석에 활용

- **파일 기반 라우터**

  - `src/pages/*/page.tsx` 파일을 스캔하여 자동으로 라우트 생성
  - 새 파일 추가만으로 라우트 자동 등록

- **클라이언트 컴포넌트 처리**

  - 서버에서 클라이언트 컴포넌트 import 에러 방지를 위한 가짜 모듈 생성
  - RSC 렌더러가 실제 클라이언트 컴포넌트를 감지하여 처리

- **코드 구조화**
  - 엔드포인트와 비즈니스 로직 분리
  - `src/utils/`로 유틸리티 모듈 분리

#### 3주차

- **서버 컴포넌트에서 비동기 데이터 페칭**

  - `async/await`를 사용한 자연스러운 데이터 페칭
  - Promise를 반환하면 RSC 렌더러가 자동으로 Suspense 처리

- **React Suspense 메커니즘 활용**

  - Promise를 throw하여 Suspense 경계 활성화
  - Promise가 resolve되면 자동으로 컴포넌트 재렌더링
  - 폴링 방식 대신 React의 네이티브 메커니즘 활용

- **RSC 페이로드 캐싱**

  - 진행 중인 요청 캐싱으로 중복 호출 방지
  - 완료 후 캐시 제거로 재렌더링 보장
  - React의 변경 감지 메커니즘과 호환

- **부분 스트리밍**

  - 느린 섹션은 스켈레톤/placeholder 먼저 표시
  - 데이터 준비 완료 시 본문 스트리밍

#### 4주차

- **서버 액션**

  - 서버에서 실행되는 함수를 클라이언트에서 직접 호출
  - React의 서버 액션 스타일 모방
  - 폼 제출 시 페이지 새로고침 없이 상태 업데이트
  - `POST /_actions` 엔드포인트로 서버 액션 처리

- **개발 경험 개선**

  - 파일 변경 자동 감지 (`chokidar`)
  - 자동 빌드 및 재시작
  - HMR을 통한 핫 리로드
  - WebSocket을 통한 실시간 알림

- **프로덕션 빌드**

  - 개발 모드와 프로덕션 모드 분리
  - 빌드 스크립트 최적화
  - 서버 실행 스크립트

## 문서

각 주차별 상세 구현 내용은 다음 문서를 참고하세요:

- [1주차 문서](./docs/WEEK1.md) - 최소 RSC 파이프라인 구현
- [2주차 문서](./docs/WEEK2.md) - 번들링 & 경계 & 파일 라우팅
- [3주차 문서](./docs/WEEK3.md) - 데이터 패칭, Suspense 스트리밍, 캐시
- [4주차 문서](./docs/WEEK4.md) - 서버 액션, DX(HMR/오버레이), 프로덕션 빌드

## 참고 자료

- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [React Server Actions](https://react.dev/reference/rsc/server-actions)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [demystify-react-server-components](https://github.com/JSerZANP/demystify-react-server-components)
