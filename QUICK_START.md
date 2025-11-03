# 🚀 빠른 시작 가이드

## 1주차 RSC 파이프라인 완성! ✨

### 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 빌드
npm run build

# 3. 서버 실행
npm run dev
```

그리고 브라우저에서 `http://localhost:3000` 을 열어보세요!

### 무엇을 확인할 수 있나요?

✅ **Home/About 버튼 전환**

- 버튼을 클릭하면 RSC 페이로드가 스트리밍으로 전달됨
- 페이지 전환이 부드럽게 동작

✅ **서버 컴포넌트**

- 서버에서 렌더링되는 콘텐츠
- 서버 시간 표시 (About 페이지)

✅ **클라이언트 컴포넌트 (Counter)**

- 상태를 가진 인터랙티브 UI
- 증가/감소/리셋 버튼

✅ **RSC 스트리밍**

- Chrome DevTools > Network 탭에서 확인
- `/react?location=/` 엔드포인트
- Content-Type: `text/x-component`

### 아키텍처

```
┌─────────────────────────────────────────┐
│           Browser (클라이언트)            │
│  ┌──────────────────────────────────┐   │
│  │  client/main.tsx                 │   │
│  │  - fetchRSC()                    │   │
│  │  - RSC 페이로드 복원              │   │
│  │  - React 렌더링                   │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ⬇ HTTP /react
┌─────────────────────────────────────────┐
│          Server (Express)                │
│  ┌──────────────────────────────────┐   │
│  │  server/entry.ts                 │   │
│  │  - GET /react?location=...       │   │
│  │  - renderToRSCStream()           │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  shared/App.server.tsx           │   │
│  │  - 서버 컴포넌트                  │   │
│  │  - Home/About 페이지              │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 디렉토리 구조

```
resecof/
├── server/              # 서버 코드
│   ├── entry.ts        # Express 서버
│   └── rsc-renderer.ts # RSC 렌더러 (renderToPipeableStream 모방)
├── shared/              # 공유 컴포넌트
│   ├── App.server.tsx  # 서버 컴포넌트
│   └── Counter.client.tsx # 클라이언트 컴포넌트
├── client/              # 클라이언트 코드
│   ├── main.tsx        # 엔트리 포인트
│   └── rsc-client.ts   # RSC 클라이언트 (createFromFetch 모방)
├── dist/                # 빌드된 서버 코드
└── public/              # 빌드된 클라이언트 코드
```

### 핵심 기능

#### 1. RSC 렌더러 (`server/rsc-renderer.ts`)

- React 컴포넌트 트리를 Flight 프로토콜 JSON으로 변환
- 클라이언트 컴포넌트 감지 및 마킹
- 스트리밍 응답

#### 2. RSC 클라이언트 (`client/rsc-client.ts`)

- Fetch API로 스트림 수신
- JSON 파싱 및 React 요소 복원
- 클라이언트 컴포넌트 레지스트리

#### 3. 라우팅

- 메모리 라우터 (`/react?location=...`)
- History API 통합
- 전환 애니메이션 (useTransition)

### 개발 팁

#### RSC 페이로드 확인하기

```bash
curl 'http://localhost:3000/react?location=/'
```

#### 클라이언트 컴포넌트 추가하기

1. `shared/` 에 `.client.tsx` 파일 생성
2. `'use client'` 디렉티브 추가
3. `client/main.tsx` 에서 `registerClientComponent()` 호출
4. 빌드 및 재시작

#### 서버 컴포넌트 추가하기

1. `shared/` 에 `.server.tsx` 파일 생성
2. async 함수 사용 가능
3. 데이터베이스, 파일 시스템 접근 가능

### 1주차 완료 기준 ✅

- ✅ `renderToPipeableStream` 모방 구현 완료
- ✅ `createFromFetch` + 스트림 파싱 완료
- ✅ `/react?location=...` 라우팅 구현
- ✅ "use client" 컴포넌트 연결
- ✅ Content-Type: `text/x-component` 설정
- ✅ Home/About 버튼 전환 동작
- ✅ SSR 없이 첫 렌더 성공

### 트러블슈팅

**서버가 시작되지 않아요**

```bash
# 빌드 확인
npm run build
# 포트 확인
lsof -ti:3000 | xargs kill -9
```

**클라이언트 컴포넌트가 작동하지 않아요**

- `client/main.tsx`에 `registerClientComponent()` 추가 확인
- 브라우저 콘솔에서 에러 확인
- 컴포넌트 이름이 정확한지 확인

**페이지 전환이 안 돼요**

- `data-navigate` 속성 확인
- 브라우저 콘솔에서 네트워크 요청 확인
- 서버 로그 확인

---

만든 사람: RSC 학습 프로젝트 1주차
