# React Server Components 미니 프레임워크 - 1주차

## 🎯 1주차 목표

최소 RSC 파이프라인(E2E) 구축

### 완료된 기능

- ✅ **서버**: `renderToRSCStream`으로 Flight 스트림 생성 (renderToPipeableStream 모방)
- ✅ **클라이언트**: `fetchRSC` + `useState`로 점진 복원 (createFromFetch 모방)
- ✅ **라우팅**: `/`, `/about`, `/home` 직접 라우팅
- ✅ **"use client" 컴포넌트** 연결 (상태 변화 확인용 Counter)
- ✅ **에러/콘텐트 타입** 세팅 (`text/x-component`)
- ✅ **Accept 헤더 기반** HTML/RSC 요청 구분

## 📁 프로젝트 구조

```
resecof/
├── server/
│   ├── entry.ts          # Express 서버 + 라우팅 + HTML/RSC 구분
│   └── rsc-renderer.ts   # RSC 렌더러 (Flight 프로토콜 구현)
├── shared/
│   ├── App.server.tsx    # 서버 컴포넌트 (Home/About 페이지)
│   └── Counter.client.tsx # 클라이언트 컴포넌트
├── client/
│   ├── main.tsx          # 클라이언트 엔트리 (라우팅 + 렌더링)
│   └── rsc-client.ts     # RSC 클라이언트 (스트림 파싱 + 복원)
├── scripts/
│   └── build.mjs         # 빌드 스크립트 (esbuild)
├── dist/                 # 빌드된 서버 코드
├── public/               # 빌드된 클라이언트 코드
└── tsconfig.json         # TypeScript 설정
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 빌드

```bash
npm run build
```

### 3. 서버 실행

```bash
npm run dev
```

### 4. 브라우저에서 확인

```
http://localhost:3000        # Home 페이지
http://localhost:3000/about  # About 페이지
http://localhost:3000/home   # Home 페이지 (별칭)
```

## 🔍 동작 원리

### 서버 (server/entry.ts)

1. **라우팅 구조**

   - `/`, `/about`, `/home` 라우트 정의
   - Accept 헤더로 요청 타입 구분:
     - `text/x-component`: RSC 스트림 반환
     - 기타 (브라우저 직접 접속): HTML 페이지 반환

2. **RSC 스트림 생성** (`renderToRSCStream`)

   - React 컴포넌트를 Flight 프로토콜 JSON으로 직렬화
   - 클라이언트 컴포넌트 감지 및 마킹 (`$ClientComponent`)
   - 비동기 컴포넌트를 위한 Suspense 청크 지원
   - `text/x-component` Content-Type으로 스트리밍 응답

3. **정적 파일 서빙**
   - `public/` 디렉토리의 클라이언트 번들 제공
   - `/client.js` 자동 서빙

### 클라이언트 (client/main.tsx + rsc-client.ts)

1. **초기 로드**

   - HTML 페이지 로드
   - `client.js` 번들 실행
   - 현재 경로(`window.location.pathname`)에서 RSC 페이로드 가져오기

2. **RSC 페이로드 가져오기** (`fetchRSC`)

   - `Accept: text/x-component` 헤더로 RSC 요청
   - 스트림 읽기 및 JSON 파싱
   - Flight 프로토콜 데이터를 React 요소로 복원

3. **데이터 복원** (`reviveRSCData`)

   - JSON 데이터를 `React.createElement`로 변환
   - 클라이언트 컴포넌트 레지스트리에서 컴포넌트 로드
   - `children` prop 재귀적 처리

4. **라우팅**
   - 버튼 클릭(`data-navigate` 속성) 또는 `popstate` 이벤트
   - `useTransition`으로 부드러운 페이지 전환
   - RSC 캐싱으로 중복 요청 방지

### 컴포넌트 타입

**서버 컴포넌트** (App.server.tsx)

- 서버에서만 실행
- 클라이언트 번들에 포함되지 않음
- 데이터베이스, 파일 시스템 접근 가능
- 상태(state) 사용 불가
- 서버 시간 생성 등 서버 리소스 활용

**클라이언트 컴포넌트** (Counter.client.tsx)

- `'use client'` 지시어 사용
- 브라우저에서 실행
- 상태(state), 이벤트 핸들러 사용 가능
- 인터랙티브한 UI 구현
- 클라이언트 컴포넌트 레지스트리에 등록 필요

## 🎨 주요 특징

### SSR 없이도 첫 렌더 성공

- 서버 컴포넌트는 서버에서 렌더링
- 클라이언트는 스트리밍으로 점진적 복원
- 초기 HTML은 최소한으로 유지 (로딩 표시만)

### RESTful 라우팅

- `/`, `/about`, `/home` 같은 표준 URL 구조
- 브라우저 주소창에 직접 입력 가능
- 뒤로가기/앞으로가기 지원

### Accept 헤더 기반 요청 구분

```typescript
// 브라우저가 직접 접속
GET / HTTP/1.1
Accept: text/html
→ HTML 페이지 반환

// JavaScript fetch로 요청
GET / HTTP/1.1
Accept: text/x-component
→ RSC 스트림 반환
```

### Home/About 버튼 전환

- RSC 페이로드가 스트리밍으로 전달
- `useTransition`으로 부드러운 전환
- 네트워크 요청 중 로딩 UI 표시 (진행 바)
- RSC 캐시로 즉시 전환 가능

### 상태 관리

- 클라이언트 컴포넌트(Counter)에서 상태 변화 확인
- 서버/클라이언트 컴포넌트 간 명확한 역할 분리
- 서버 컴포넌트는 props만 전달

## 📊 네트워크 확인

Chrome DevTools에서 확인할 수 있는 것:

### Network 탭

1. **초기 HTML 요청**

   ```
   GET / HTTP/1.1
   Accept: text/html
   Response: HTML 페이지
   ```

2. **RSC 페이로드 요청**

   ```
   GET / HTTP/1.1
   Accept: text/x-component
   Response: text/x-component
   ```

3. **클라이언트 번들**
   ```
   GET /client.js
   Response: JavaScript 번들
   ```

### Response 형식

RSC 페이로드 예시:

```json
{"type":"root","data":{"$$typeof":"Symbol(react.element)","type":"div",...},"clientComponents":["Counter"]}
```

- `type: "root"`: 초기 렌더링 데이터
- `type: "chunk"`: 비동기 컴포넌트 청크
- `type: "error"`: 에러 발생 시
- `clientComponents`: 사용된 클라이언트 컴포넌트 목록

## 🐛 디버깅

### 서버 로그 확인

```bash
# 서버 실행 시 콘솔에 출력
✨ 서버가 http://localhost:3000 에서 실행 중입니다
📡 RSC 라우트: /, /about, /home
📁 정적 파일 디렉토리: /path/to/public
📡 RSC 요청: path=/
```

### 클라이언트 로그 확인

브라우저 콘솔에서:

```
✨ React Server Components 클라이언트 초기화 완료
📡 RSC 스트리밍으로 컴포넌트를 받아오고 있습니다
📦 RSC root payload received
✅ RSC data revived: ...
📦 Content received: ...
🎨 Rendering content: ...
```

### 문제 해결

**404 에러 (client.js)**

- `public/client.js` 파일이 있는지 확인
- 빌드가 완료되었는지 확인: `npm run build`

**로딩만 표시되고 렌더링 안 됨**

- 브라우저 콘솔에서 에러 확인
- Network 탭에서 RSC 요청 상태 확인
- 서버 로그에서 에러 메시지 확인

**라우팅이 안 됨**

- `data-navigate` 속성이 올바른지 확인
- Accept 헤더가 올바르게 전송되는지 확인

## 🔧 구현 세부사항

### RSC 렌더러 (server/rsc-renderer.ts)

- React 요소를 Flight 프로토콜 JSON으로 직렬화
- 클라이언트 컴포넌트 감지 (파일명에 `.client` 포함 또는 명시적 마킹)
- 비동기 컴포넌트를 위한 Promise 처리 및 Suspense 청크
- 스트리밍 응답 (줄 단위 JSON)

### RSC 클라이언트 (client/rsc-client.ts)

- Fetch API로 스트림 읽기
- TextDecoder로 청크 디코딩
- 줄 단위 JSON 파싱
- `React.createElement`로 요소 복원
- 클라이언트 컴포넌트 레지스트리 관리

### 빌드 시스템 (scripts/build.mjs)

- **클라이언트**: esbuild로 번들링 (ESM)
- **서버**: esbuild로 트랜스파일 (ESM, external packages)

## 🚧 제한사항 (1주차)

- ❌ SSR 없음 (순수 RSC 복원만)
- ❌ 실제 번들러 통합 없음 (간단한 esbuild 빌드만)
- ❌ 최적화 없음 (코드 스플리팅, 캐싱 전략 없음)
- ❌ 에러 바운더리 미구현
- ❌ 서버 액션 미구현
- ❌ Streaming SSR 미구현

## 📚 다음 단계 (2주차 이후)

- [ ] SSR 추가 (초기 HTML에 서버 컴포넌트 렌더링)
- [ ] Streaming SSR (점진적 HTML 스트리밍)
- [ ] 실제 번들러 통합 (Webpack/Vite)
- [ ] 코드 스플리팅 및 지연 로딩
- [ ] 에러 바운더리 구현
- [ ] 서버 액션 (Server Actions)
- [ ] 캐싱 전략 (RSC 캐시, 정적 생성)
- [ ] 폼 처리 및 서버 제출

## 🔗 참고 자료

- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [React 18 Docs](https://react.dev/)
- [Next.js App Router](https://nextjs.org/docs/app) (실제 RSC 구현 참고)
- [Flight 프로토콜](https://github.com/facebook/react/blob/main/packages/react-server/src/ReactFlightServer.js)

## 💡 학습 포인트

1. **Flight 프로토콜**: React 요소를 직렬화하여 네트워크로 전송하는 방법
2. **서버/클라이언트 분리**: 컴포넌트가 어디서 실행되는지 명확히 구분
3. **스트리밍**: 점진적으로 데이터를 받아서 UI를 업데이트
4. **라우팅**: URL 기반 네비게이션과 RSC 요청의 관계
5. **상태 관리**: 서버 컴포넌트는 stateless, 클라이언트 컴포넌트만 stateful
