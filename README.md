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

## 빌드 및 실행

### 스크립트

```json
{
  "scripts": {
    "dev": "npm run build && node dist/server/index.js",
    "build": "rm -rf dist && node scripts/build.mjs"
  }
}
```

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

```bash
# 1. 의존성 설치
npm install

# 2. 빌드
npm run build

# 3. 서버 실행
npm run dev
```

서버는 `http://localhost:3000`에서 실행됩니다.

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

## 문서

- [1주차 문서](./docs/WEEK1.md) - 최소 RSC 파이프라인 구현
- [2주차 문서](./docs/WEEK2.md) - 번들링 & 경계 & 파일 라우팅

## 참고 자료

- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [Next.js App Router](https://nextjs.org/docs/app)
- [demystify-react-server-components](https://github.com/JSerZANP/demystify-react-server-components)
