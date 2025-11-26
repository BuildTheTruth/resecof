# 4주차: 서버 액션, DX(HMR/오버레이), 프로덕션 빌드

## 1. 목표

- **서버 액션** 구현 (폼/뮤테이션 스타일 도입)
- **Dev DX**: HMR(클라), 서버 자동 재빌드, 에러 오버레이
- **프로덕션 빌드/런북/벤치마크**

### ✅ 완료 사항

- [x] 서버 액션 구현 (`actions/like.ts` 등 서버 함수 → 폼 `action`으로 호출)
- [x] 개발 서버: 파일 변경 감지 → 클라 HMR, 서버 재시작(초경량)
- [x] 빌드 스크립트: `dev / build / start`
- [x] 서버 액션 클라이언트/서버 유틸리티 구현
- [x] HMR WebSocket 서버/클라이언트 구현
- [x] LikeButton 컴포넌트를 통한 서버 액션 사용 예시

---

## 2. 구현 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────┐
│           Browser (클라이언트)             │
│  ┌──────────────────────────────────┐   │
│  │  LikeButton.tsx                  │   │
│  │  - callServerAction 호출         │   │
│  │  - 상태 업데이트                  │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  hmr-client.ts                   │   │
│  │  - WebSocket 연결                │   │
│  │  - 파일 변경 감지                 │   │
│  │  - 핫 리로드                      │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ⬇ HTTP/WebSocket
┌─────────────────────────────────────────┐
│          Server (Express)               │
│  ┌──────────────────────────────────┐   │
│  │  POST /_actions                  │   │
│  │  - handleServerAction            │   │
│  │  - 동적 액션 로드                 │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  hmr-server.ts                   │   │
│  │  - WebSocket 서버                │   │
│  │  - 파일 변경 알림                 │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  dev-server.mjs                  │   │
│  │  - 파일 감시 (chokidar)          │   │
│  │  - 자동 빌드/재시작               │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 서버 액션 흐름

1. **클라이언트에서 서버 액션 호출**

   - `LikeButton` 컴포넌트가 `callServerAction` 호출
   - POST 요청을 `/_actions` 엔드포인트로 전송

2. **서버에서 액션 실행**

   - `handleServerAction`이 요청 처리
   - `actionId`와 `functionName`으로 동적 모듈 로드
   - 액션 함수 실행 후 결과 반환

3. **클라이언트에서 상태 업데이트**
   - 성공 시 `setLikes`로 상태 업데이트
   - 에러 시 에러 메시지 표시

### HMR 흐름

1. **파일 변경 감지**

   - `dev-server.mjs`가 `chokidar`로 파일 변경 감지
   - 변경된 파일 타입에 따라 다른 처리

2. **자동 빌드 및 재시작**

   - 서버 파일 변경 → 서버 재시작
   - 클라이언트 컴포넌트 변경 → 클라이언트 빌드 + HMR 알림
   - 페이지 파일 변경 → 전체 빌드 + 서버 재시작

3. **클라이언트에 알림**
   - WebSocket을 통해 클라이언트에 파일 변경 알림
   - 클라이언트가 자동으로 리로드 또는 핫 리로드

---

## 3. 핵심 구현 내용

### 3.1 서버 액션 구현

#### `src/actions/like.ts`

서버에서 실행되는 액션 함수를 정의합니다. 실제로는 DB 업데이트 등이 일어나지만, 여기서는 메모리 스토어를 사용합니다.

```typescript
export async function likePost(postId: string): Promise<number> {
  const currentLikes = likesStore.get(postId) || 0;
  const newLikes = currentLikes + 1;
  likesStore.set(postId, newLikes);
  await new Promise((resolve) => setTimeout(resolve, 300));
  return newLikes;
}
```

#### `src/utils/server-actions.ts`

서버에서 서버 액션 요청을 처리하는 핸들러입니다.

**주요 기능:**

- `actionId`와 `functionName`으로 동적 모듈 로드
- 액션 함수 실행 및 결과 반환
- 에러 처리

#### `src/utils/server-actions-client.ts`

클라이언트에서 서버 액션을 호출하는 유틸리티입니다.

**주요 함수:**

- `callServerAction`: 서버 액션 호출
- `createServerAction`: 서버 액션 함수 래핑
- `createFormAction`: 폼의 `action` prop에 사용할 수 있는 핸들러 생성

**사용 예시:**

```typescript
const result = await callServerAction<number>(
  "actions/like",
  "likePost",
  postId
);

if (result.type === "success") {
  setLikes(result.data);
}
```

#### `src/components/LikeButton.tsx`

서버 액션을 사용하는 클라이언트 컴포넌트 예시입니다.

**주요 기능:**

- `callServerAction`을 사용하여 좋아요 수 업데이트
- `isPending` 상태로 로딩 표시
- 에러 처리 및 표시

### 3.2 개발 서버 구현

#### `scripts/dev-server.mjs`

파일 변경 감지 및 자동 빌드/재시작을 담당하는 개발 서버입니다.

**주요 기능:**

- `chokidar`를 사용한 파일 변경 감지
- 변경된 파일 타입에 따른 다른 처리:
  - 서버 파일 (`src/server/`) → 서버 재시작
  - 페이지 파일 (`src/pages/`) → 전체 빌드 + 서버 재시작
  - 클라이언트 컴포넌트 (`src/components/`) → 클라이언트 빌드 + HMR
  - 서버 액션 (`src/actions/`) → 서버 재시작
- 디바운스 처리 (500ms)로 중복 빌드 방지

**실행 방법:**

```bash
npm run dev
```

#### `src/utils/hmr-server.ts`

HMR WebSocket 서버를 구현합니다.

**주요 기능:**

- WebSocket 서버 시작/종료
- 클라이언트 연결 관리
- 파일 변경 알림 전송

#### `src/utils/hmr-client.ts`

클라이언트에서 HMR을 처리하는 로직입니다.

**주요 기능:**

- WebSocket 연결 및 재연결
- 파일 변경 메시지 처리
- 컴포넌트 핫 리로드 또는 전체 페이지 리로드

**초기화:**

```typescript
import { initHMR } from "./utils/hmr-client.js";

// main.ts에서 초기화
initHMR();
```

### 3.3 서버 액션 엔드포인트

#### `src/server/index.ts`

서버 액션 엔드포인트를 등록합니다.

```typescript
// 서버 액션 엔드포인트
app.post("/_actions", async (req, res) => {
  await handleServerAction(req, res);
});

// HMR 알림 엔드포인트 (개발 모드에서만)
if (isDev) {
  app.post("/_hmr/notify", (req, res) => {
    const { type, file } = req.body;
    if (type === "file-change" && file) {
      notifyFileChange(file);
    } else if (type === "reload") {
      notifyReload();
    }
    res.json({ success: true });
  });
}
```

### 3.4 프로덕션 빌드

#### `package.json` 스크립트

```json
{
  "scripts": {
    "dev": "node scripts/dev-server.mjs",
    "build": "rm -rf dist && node scripts/build.mjs",
    "start": "node dist/server/index.js"
  }
}
```

**사용 방법:**

- `npm run dev`: 개발 서버 시작 (HMR 지원)
- `npm run build`: 프로덕션 빌드
- `npm start`: 프로덕션 서버 실행

---

## 4. 주요 개선 사항

### 4.1 서버 액션 도입

**이전 방식 (문제점):**

- 폼 제출 시 전체 페이지 리로드
- 상태 관리가 복잡함

**개선된 방식:**

- 서버 액션을 통한 점진적 상태 업데이트
- 페이지 새로고침 없이 상태 반영
- React의 서버 액션 스타일 모방

### 4.2 개발 경험 개선

**이전 방식 (문제점):**

- 파일 변경 시 수동으로 빌드 및 재시작 필요
- 변경 사항 확인을 위한 수동 새로고침

**개선된 방식:**

- 파일 변경 자동 감지
- 자동 빌드 및 재시작
- HMR을 통한 자동 리로드
- WebSocket을 통한 실시간 알림

### 4.3 프로덕션 빌드 최적화

**구현 내용:**

- `build` 스크립트로 프로덕션 빌드
- `start` 스크립트로 프로덕션 서버 실행
- 개발 모드와 프로덕션 모드 분리

---

## 5. 데모 및 결과

### 5.1 실행 방법

#### 개발 모드

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 시작 (자동 빌드 + HMR)
npm run dev
```

#### 프로덕션 모드

```bash
# 1. 빌드
npm run build

# 2. 서버 실행
npm start
```

### 5.2 동작 시나리오

#### 서버 액션 사용

1. **블로그 포스트 페이지 접속**

   - `http://localhost:3000/blogs/1` 접속
   - `LikeButton` 컴포넌트 표시

2. **좋아요 버튼 클릭**
   - `callServerAction` 호출
   - POST 요청을 `/_actions`로 전송
   - 서버에서 `likePost` 함수 실행
   - 좋아요 수 업데이트
   - 페이지 새로고침 없이 상태 반영

#### HMR 동작

1. **클라이언트 컴포넌트 수정**

   - `src/components/LikeButton.tsx` 수정
   - 파일 변경 감지
   - 자동 빌드 실행
   - WebSocket으로 클라이언트에 알림
   - 자동 리로드

2. **서버 파일 수정**

   - `src/server/posts.ts` 수정
   - 파일 변경 감지
   - 자동 빌드 실행
   - 서버 자동 재시작

3. **페이지 파일 수정**
   - `src/pages/blogs/[id].tsx` 수정
   - 파일 변경 감지
   - 전체 빌드 실행
   - 서버 자동 재시작

### 5.3 완료 기준 달성

- ✅ 폼 전송이 전역 상태 리프레시 없이 서버에서 반영
- ✅ `npm run build && npm start`로 프로덕션 실행 가능
- ✅ 파일 변경 시 자동 빌드 및 재시작
- ✅ HMR을 통한 자동 리로드

---

## 6. 학습 내용 및 다음 단계

### 6.1 주요 학습 내용

#### 서버 액션 패턴

- 서버에서 실행되는 함수를 클라이언트에서 직접 호출
- React의 서버 액션 스타일 모방
- 폼 제출 시 페이지 새로고침 없이 상태 업데이트

#### 개발 경험 개선

- 파일 변경 자동 감지 (`chokidar`)
- 자동 빌드 및 재시작
- HMR을 통한 핫 리로드
- WebSocket을 통한 실시간 알림

#### 프로덕션 빌드

- 개발 모드와 프로덕션 모드 분리
- 빌드 스크립트 최적화
- 서버 실행 스크립트

### 6.2 구현의 한계 (4주차)

- ❌ React Fast Refresh 미구현 (현재는 전체 페이지 리로드)
- ❌ 에러 오버레이 미구현
- ❌ 벤치마크 미구현 (첫 바이트 시간, 스트림 완료 시간)
- ❌ LRU 캐시 미구현
- ❌ 에러 바운더리 미구현

### 6.3 다음 단계

1. **React Fast Refresh 구현**

   - 컴포넌트 상태 유지하면서 핫 리로드
   - 전체 페이지 리로드 대신 컴포넌트만 업데이트

2. **에러 오버레이**

   - 빌드 에러 시 친화적인 에러 UI
   - 런타임 에러 오버레이

3. **벤치마크**

   - 첫 바이트까지 시간 측정
   - 전체 스트림 완료 시간 측정
   - 성능 모니터링

4. **캐싱 최적화**

   - LRU 캐시 구현
   - 캐시 무효화 전략

5. **에러 처리**
   - 에러 바운더리 구현
   - 친화적인 에러 UI

---

## 7. 파일 구조

```
src/
├── actions/
│   └── like.ts                    # 서버 액션 예시
├── components/
│   └── LikeButton.tsx             # 서버 액션 사용 예시
├── utils/
│   ├── server-actions.ts          # 서버 액션 처리 (서버)
│   ├── server-actions-client.ts   # 서버 액션 클라이언트 유틸
│   ├── hmr-server.ts              # HMR WebSocket 서버
│   └── hmr-client.ts              # HMR 클라이언트
├── server/
│   └── index.ts                   # 서버 액션 엔드포인트 등록
└── scripts/
    └── dev-server.mjs              # 개발 서버 (파일 감시, 자동 빌드)
```

---

## 🔗 참고 자료

- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [React Server Actions](https://react.dev/reference/rsc/server-actions)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [chokidar](https://github.com/paulmillr/chokidar)
- [demystify-react-server-components](https://github.com/JSerZANP/demystify-react-server-components)
