# React Server Components 미니 프레임워크 - 1주차

## 🎯 1주차 목표

최소 RSC 파이프라인(E2E) 구축

### 완료된 기능

- ✅ **서버**: `renderToPipeableStream`으로 Flight 스트림 생성
- ✅ **클라이언트**: `createFromFetch` + `use()`로 점진 복원
- ✅ **최소 라우팅**: `/react?location=...` (메모리 라우터)
- ✅ **"use client" 컴포넌트** 연결 (상태 변화 확인용)
- ✅ **에러/콘텐트 타입** 세팅 (`text/x-component`)

## 📁 프로젝트 구조

```
resecof/
├── server/
│   └── entry.ts          # Express 서버 + RSC 엔드포인트
├── shared/
│   ├── App.server.tsx    # 서버 컴포넌트 (Home/About)
│   └── Counter.client.tsx # 클라이언트 컴포넌트
├── client/
│   └── main.tsx          # 클라이언트 엔트리 (createFromFetch + use)
├── dist/                 # 빌드된 서버 코드
├── public/               # 빌드된 클라이언트 코드
└── build.mjs             # 빌드 스크립트
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
http://localhost:3000
```

## 🔍 동작 원리

### 서버 (server/entry.ts)

1. `/react?location=...` 엔드포인트에서 RSC 요청 처리
2. `renderToPipeableStream`을 사용하여 React 컴포넌트를 Flight 스트림으로 변환
3. `text/x-component` Content-Type으로 스트리밍 응답

### 클라이언트 (client/main.tsx)

1. `createFromFetch`로 RSC 스트림 가져오기
2. `use()` 훅으로 스트림 데이터 읽기
3. React가 점진적으로 컴포넌트 복원
4. 버튼 클릭 시 새로운 RSC 요청으로 화면 전환

### 컴포넌트 타입

**서버 컴포넌트** (App.server.tsx)

- 서버에서만 실행
- 클라이언트 번들에 포함되지 않음
- 데이터베이스, 파일 시스템 접근 가능
- 상태(state) 사용 불가

**클라이언트 컴포넌트** (Counter.client.tsx)

- `'use client'` 지시어 사용
- 브라우저에서 실행
- 상태(state), 이벤트 핸들러 사용 가능
- 인터랙티브한 UI 구현

## 🎨 주요 특징

### SSR 없이도 첫 렌더 성공

- 서버 컴포넌트는 서버에서 렌더링
- 클라이언트는 스트리밍으로 점진적 복원
- 초기 HTML은 최소한으로 유지

### Home/About 버튼 전환

- RSC 페이로드가 스트리밍으로 전달
- `useTransition`으로 부드러운 전환
- 네트워크 요청 중 로딩 UI 표시

### 상태 관리

- 클라이언트 컴포넌트(Counter)에서 상태 변화 확인
- 서버/클라이언트 컴포넌트 간 명확한 역할 분리

## 📊 네트워크 확인

Chrome DevTools에서 확인할 수 있는 것:

1. **Network 탭**

   - `/react?location=/` 요청 (Home)
   - `/react?location=/about` 요청 (About)
   - Content-Type: `text/x-component`

2. **Response 형식**
   - RSC 페이로드 (Flight 프로토콜)
   - 스트리밍으로 전달되는 컴포넌트 트리

## 🐛 디버깅

### 서버 로그 확인

```bash
# 서버 실행 시 콘솔에 출력
✨ 서버가 http://localhost:3000 에서 실행 중입니다
📡 RSC 엔드포인트: http://localhost:3000/react
```

### 클라이언트 로그 확인

브라우저 콘솔에서:

```
✨ React Server Components 클라이언트 초기화 완료
📡 RSC 스트리밍으로 컴포넌트를 받아오고 있습니다
```

## 🚧 제한사항 (1주차)

- ❌ SSR 없음 (순수 RSC 복원만)
- ❌ 실제 번들러 통합 없음 (간단한 빌드만)
- ❌ 최적화 없음
- ❌ 에러 바운더리 미구현

## 📚 다음 단계 (2주차 이후)

- SSR 추가
- 실제 번들러(Webpack/Vite) 통합
- 청크 분할 및 지연 로딩
- 에러 처리 개선
- 캐싱 전략

## 🔗 참고 자료

- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [React 18 Docs](https://react.dev/)
