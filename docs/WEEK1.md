# 1주차 발표: React Server Components 미니 프레임워크

## 📋 목차

1. 프로젝트 소개
2. 1주차 목표
3. 구현 아키텍처
4. 핵심 구현 내용
5. 데모 및 결과
6. 학습 내용 및 다음 단계

---

## 1. 프로젝트 소개

### React Server Components란?

React Server Components(RSC)는 서버에서 실행되는 React 컴포넌트로, 다음과 같은 특징이 있습니다:

- ✅ 서버에서만 실행 → 클라이언트 번들 크기 감소
- ✅ 데이터베이스/파일 시스템 직접 접근 가능
- ✅ 민감한 정보를 안전하게 처리
- ✅ 클라이언트 JavaScript 없이도 동작 가능

### 프로젝트 목표

React Server Components의 동작 원리를 이해하기 위해 **최소한의 RSC 프레임워크를 직접 구현**합니다.

---

## 2. 1주차 목표

### 🎯 목표

**최소 RSC 파이프라인(E2E) 구축**

- 서버: `renderToRSCStream`으로 Flight 스트림 생성
- 클라이언트: `fetchRSC` + `useState`로 점진 복원
- 직접 라우팅: `/`, `/about`, `/home` (Accept 헤더로 HTML/RSC 구분)

### ✅ 완료 사항

- [x] Express 서버 + RSC 엔드포인트 구현
- [x] Flight 프로토콜 직접 구현 (`renderToRSCStream`)
- [x] RSC 클라이언트 구현 (`fetchRSC`)
- [x] 서버/클라이언트 컴포넌트 분리
- [x] 라우팅 시스템 (Accept 헤더 기반)
- [x] 클라이언트 컴포넌트 레지스트리
- [x] `"use client"` 컴포넌트 연결 (Counter)

---

## 3. 구현 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────┐
│           Browser (클라이언트)             │
│  ┌──────────────────────────────────┐   │
│  │  client/main.tsx                 │   │
│  │  - fetchRSC()                    │   │
│  │  - RSC 페이로드 복원                │   │
│  │  - React 렌더링                    │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ⬇ HTTP
┌─────────────────────────────────────────┐
│          Server (Express)               │
│  ┌──────────────────────────────────┐   │
│  │  server/entry.ts                 │   │
│  │  - GET /, /about, /home          │   │
│  │  - Accept 헤더로 구분               │   │
│  │  - renderToRSCStream()           │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  shared/App.server.tsx           │   │
│  │  - 서버 컴포넌트                    │   │
│  │  - Home/About 페이지               │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 프로젝트 구조

```
resecof/
├── server/
│   ├── entry.ts          # Express 서버 + 라우팅
│   └── rsc-renderer.ts   # RSC 렌더러 (Flight 프로토콜)
├── shared/
│   ├── App.server.tsx    # 서버 컴포넌트
│   └── Counter.client.tsx # 클라이언트 컴포넌트
├── client/
│   ├── main.tsx          # 클라이언트 엔트리
│   └── rsc-client.ts     # RSC 클라이언트
└── scripts/
    └── build.mjs         # 빌드 스크립트
```

---

## 4. 핵심 구현 내용

### 4.1 서버 사이드: Flight 스트림 생성

#### `server/rsc-renderer.ts`

React 컴포넌트를 Flight 프로토콜 JSON으로 직렬화합니다.

**핵심 기능:**

- React 요소 트리를 재귀적으로 순회
- 클라이언트 컴포넌트 감지 및 마킹 (`$ClientComponent`)
- 비동기 컴포넌트를 위한 Suspense 청크 지원
- 스트리밍 응답 (줄 단위 JSON)

```typescript
export function renderToRSCStream(element: any, res: Response) {
  // React 요소를 Flight 프로토콜 JSON으로 변환
  const rendered = renderElement(element, context);

  // Content-Type 설정
  res.setHeader("Content-Type", "text/x-component");

  // 스트림 전송
  context.pipe({
    type: "root",
    data: rendered,
    clientComponents: Array.from(context.clientComponents),
  });
}
```

### 4.2 클라이언트 사이드: RSC 페이로드 복원

#### `client/rsc-client.ts`

서버에서 전송된 Flight 프로토콜 JSON을 React 요소로 복원합니다.

**핵심 기능:**

- Fetch API로 스트림 읽기
- TextDecoder로 청크 디코딩
- 줄 단위 JSON 파싱
- `React.createElement`로 요소 복원

```typescript
export async function fetchRSC(location: string): Promise<any> {
  const response = await fetch(location, {
    headers: { Accept: "text/x-component" },
  });

  // 스트림 읽기 및 파싱
  const reader = response.body?.getReader();
  // ... 스트림 처리

  // JSON을 React 요소로 복원
  return reviveRSCData(rootData, clientComponents);
}
```

### 4.3 라우팅: Accept 헤더 기반 구분

#### `server/entry.ts`

하나의 엔드포인트에서 HTML과 RSC 요청을 구분합니다.

```typescript
function handleRoute(req: express.Request, res: express.Response) {
  const accept = req.headers.accept || "";

  // RSC 요청 (text/x-component를 명시적으로 요청)
  if (accept.includes("text/x-component")) {
    handleRSCRequest(req, res); // RSC 스트림 반환
  } else {
    sendHTMLPage(req, res); // HTML 페이지 반환
  }
}
```

**동작 방식:**

- 브라우저 직접 접속: `Accept: text/html` → HTML 페이지
- JavaScript fetch: `Accept: text/x-component` → RSC 스트림

### 4.4 클라이언트 컴포넌트 레지스트리

서버에서 `$ClientComponent`로 마킹된 컴포넌트를 클라이언트에서 동적으로 로드합니다.

```typescript
// 클라이언트 컴포넌트 등록
registerClientComponent("Counter", Counter);

// 서버에서 마킹
{
  $$typeof: Symbol.for("react.element"),
  type: "$ClientComponent",
  props: { $componentName: "Counter" }
}

// 클라이언트에서 복원
const component = window.__CLIENT_COMPONENTS__["Counter"];
element.type = component;
```

---

## 5. 데모 및 결과

### 5.1 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 빌드
npm run build

# 3. 서버 실행
npm run dev
```

### 5.2 데모 시나리오

1. **브라우저 접속**

   - `http://localhost:3000/` 접속
   - HTML 페이지 로드
   - JavaScript 번들 실행
   - RSC 페이로드 가져오기

2. **페이지 네비게이션**

   - Home/About 버튼 클릭
   - RSC 페이로드 스트리밍으로 전달
   - `useTransition`으로 부드러운 전환

3. **클라이언트 컴포넌트**
   - Counter 컴포넌트의 상태 변화 확인
   - 서버 컴포넌트와 클라이언트 컴포넌트의 역할 분리 확인

### 5.3 네트워크 확인

**Chrome DevTools Network 탭:**

```
GET / HTTP/1.1
Accept: text/html
→ HTML 페이지 반환

GET / HTTP/1.1
Accept: text/x-component
→ RSC 스트림 반환 (text/x-component)
```

**RSC 페이로드 예시:**

```json
{
  "type": "root",
  "data": {
    "$$typeof": "Symbol(react.element)",
    "type": "div",
    "props": { ... }
  },
  "clientComponents": ["Counter"]
}
```

### 5.4 완료 기준 달성

- ✅ `Home/About` 버튼 전환 시 RSC 페이로드가 스트리밍으로 화면에 그려짐
- ✅ SSR 없이도(순수 RSC 복원) 첫 렌더 성공
- ✅ 브라우저 주소창에 직접 경로 입력 시 정상 동작
- ✅ 클라이언트 컴포넌트(Counter)의 상태 변화 확인 가능

---

## 6. 학습 내용 및 다음 단계

### 6.1 주요 학습 내용

#### Flight 프로토콜

- React 요소를 직렬화하여 네트워크로 전송하는 방법
- 서버와 클라이언트 간의 컴포넌트 트리 교환 프로토콜

#### 서버/클라이언트 분리

- 서버 컴포넌트: 서버에서만 실행, 번들에 포함 안 됨
- 클라이언트 컴포넌트: 브라우저에서 실행, 상태 사용 가능

#### 스트리밍

- 점진적으로 데이터를 받아서 UI를 업데이트
- 초기 로딩 시간 단축

#### 라우팅

- URL 기반 네비게이션과 RSC 요청의 관계
- Accept 헤더를 활용한 요청 타입 구분

### 6.2 구현의 한계 (1주차)

- ❌ SSR 없음 (순수 RSC 복원만)
- ❌ 실제 번들러 통합 없음 (간단한 esbuild 빌드만)
- ❌ 최적화 없음 (코드 스플리팅, 캐싱 전략 없음)
- ❌ 에러 바운더리 미구현
- ❌ 서버 액션 미구현

### 6.3 다음 단계 (2주차)

1. **번들링 & 경계**

   - 서버/클라 번들 분리
   - 클라이언트 매니페스트 생성
   - 파일 기반 라우터

2. **데이터 패칭 & Suspense**

   - 서버 컴포넌트에서 DB/API 접근
   - Suspense 경계로 부분 스트리밍
   - Flight 응답 캐시

3. **서버 액션 & DX**
   - 서버 액션 구현
   - HMR 지원
   - 프로덕션 빌드 최적화

---

## 📊 성과 및 인사이트

### 성과

- ✅ React Server Components의 핵심 원리 이해
- ✅ Flight 프로토콜 직접 구현을 통한 깊은 이해
- ✅ 최소한의 RSC 파이프라인 구축 완료

### 인사이트

1. **서버 컴포넌트의 장점**

   - 클라이언트 번들 크기 감소
   - 서버 리소스 직접 활용
   - 보안 향상

2. **구현의 복잡성**

   - Flight 프로토콜 직렬화/역직렬화
   - 서버/클라이언트 컴포넌트 경계 관리
   - 스트리밍 처리

3. **실제 프레임워크의 필요성**
   - Next.js 같은 프레임워크가 제공하는 도구들의 가치
   - 번들링, 라우팅, 최적화 등의 복잡성

---

## 🔗 참고 자료

- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [React 18 Docs](https://react.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Flight 프로토콜](https://github.com/facebook/react/blob/main/packages/react-server/src/ReactFlightServer.js)

---
