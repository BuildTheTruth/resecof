# 3주차: 데이터 패칭, Suspense 스트리밍, 캐시

## 1. 목표

- **서버 컴포넌트에서 비동기 데이터 페칭** (DB/외부 API 접근)
- **Suspense 경계로 부분 스트리밍** 구현
- **RSC 페이로드 캐싱** (중복 요청 방지 및 재렌더링 보장)
- **로딩 상태 UI** 개선

### ✅ 완료 사항

- [x] 서버 컴포넌트에서 비동기 데이터 페칭 (`getPost`, `getPosts`)
- [x] React Suspense 메커니즘을 활용한 스트리밍 구현
- [x] SuspenseContent 컴포넌트 단순화 (setInterval 제거)
- [x] RSC 페이로드 캐싱 로직 개선 (중복 API 호출 방지)
- [x] 서버 컴포넌트 중첩 구조 처리
- [x] 로딩 스피너 표시 개선

---

## 2. 구현 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────┐
│           Browser (클라이언트)             │
│  ┌──────────────────────────────────┐   │
│  │  Root.tsx                        │   │
│  │  - useTransition                 │   │
│  │  - Suspense (fallback)           │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Content.tsx                     │   │
│  │  - Promise 처리                  │   │
│  │  - LoadingSpinner 표시           │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  SuspenseContent.tsx             │   │
│  │  - Promise throw                 │   │
│  │  - Suspense 경계 활성화           │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ⬇ HTTP
┌─────────────────────────────────────────┐
│          Server (Express)               │
│  ┌──────────────────────────────────┐   │
│  │  pages/blogs/[id].tsx            │   │
│  │  - async function                │   │
│  │  - await getPost(id)             │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  rsc-renderer.ts                 │   │
│  │  - Promise 감지                  │   │
│  │  - $Suspense 생성                │   │
│  │  - 청크 스트리밍                  │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 데이터 흐름

1. **서버 컴포넌트에서 비동기 데이터 페칭**

   - `BlogPost` 컴포넌트가 `await getPost(id)` 호출
   - Promise를 반환하면 RSC 렌더러가 `$Suspense` 생성

2. **스트리밍 응답**

   - 초기 렌더링: `$Suspense` placeholder 전송
   - 데이터 준비 완료: `chunk` 페이로드 전송

3. **클라이언트에서 Suspense 처리**
   - `SuspenseContent`가 Promise를 throw하여 Suspense 경계 활성화
   - 데이터 도착 시 자동으로 재렌더링

---

## 3. 핵심 구현 내용

### 3.1 서버 컴포넌트에서 비동기 데이터 페칭

#### `src/pages/blogs/[id].tsx`

서버 컴포넌트에서 `async/await`를 사용하여 데이터를 페칭합니다. Promise를 반환하면 RSC 렌더러가 자동으로 `$Suspense` placeholder를 생성합니다.

#### `src/server/posts.ts`

데이터 페칭 함수는 지연을 포함하여 비동기 동작을 시뮬레이션합니다.

### 3.2 RSC 렌더러에서 Promise 처리

#### `src/utils/rsc-renderer.ts`

서버 컴포넌트가 Promise를 반환하면:

- `$Suspense` placeholder를 생성하여 즉시 전송
- Promise가 resolve되면 `chunk` 페이로드로 전송
- Promise가 reject되면 `error` 페이로드로 전송

### 3.3 클라이언트에서 Suspense 처리

#### `src/components/SuspenseContent.tsx`

React의 Suspense 메커니즘을 활용합니다:

- 데이터가 없으면 Promise를 throw하여 Suspense 경계 활성화
- Promise가 resolve되면 React가 자동으로 컴포넌트 재렌더링
- `setInterval` 같은 폴링 방식은 필요 없음

#### `src/utils/rsc-client.ts`

Suspense 청크를 추적하고 Promise를 관리합니다:

- `getSuspenseChunk`: 청크 ID로 Promise 생성/조회
- 청크 데이터 도착 시 Promise resolve하여 자동 재렌더링 트리거

### 3.4 RSC 페이로드 캐싱

#### `src/utils/rsc-cache.ts`

중복 API 호출을 방지하면서도 재렌더링을 보장하는 캐싱 로직:

**캐싱 전략:**

1. **진행 중인 요청 캐싱**: 같은 location에 대한 동시 요청은 하나의 Promise를 공유
2. **완료 후 캐시 제거**: Promise가 완료되면 캐시에서 제거하여 다음 요청 시 새로운 Promise 생성
3. **재렌더링 보장**: 새로운 Promise를 생성하므로 React가 변경을 감지하고 재렌더링

### 3.5 서버 컴포넌트 중첩 구조 처리

#### `src/utils/rsc-client.ts` - `reviveRSCData`

`reviveRSCData` 함수가 재귀적으로 호출되어 서버 컴포넌트의 중첩 구조를 처리합니다. `$Suspense` 요소를 만나면 `SuspenseContent` 컴포넌트로 변환합니다.

### 3.6 로딩 상태 UI 개선

#### `src/components/Content.tsx`

새로운 Promise를 받을 때마다 상태를 초기화하여 로딩 스피너를 표시합니다.

**중요한 점:**

- 서버 컴포넌트에서 `React.Suspense`를 직접 사용하면 에러 발생
  - 서버 렌더러가 `React.Suspense` 심볼을 HTML 태그로 직렬화하려고 시도
  - `InvalidCharacterError` 에러 발생
- 클라이언트 컴포넌트에서 Suspense를 사용해야 함

---

## 4. 주요 개선 사항

### 4.1 setInterval 제거

**이전 방식 (문제점):**

- 주기적으로 청크 상태를 확인하는 폴링 방식
- 불필요한 리소스 사용

**개선된 방식:**

- React의 Suspense 메커니즘 활용
- Promise를 throw하여 React가 자동으로 재렌더링
- 더 효율적이고 예측 가능한 동작

### 4.2 중복 API 호출 방지

**문제점:**

- 같은 location에 대해 `getRSCPayload`가 여러 번 호출되면 중복 API 호출 발생
- React Strict Mode나 Suspense 재렌더링으로 인한 중복 요청

**해결 방법:**

- 진행 중인 요청을 캐시하여 동시 요청 공유
- Promise 완료 후 캐시 제거하여 재렌더링 보장

### 4.3 재렌더링 보장

**문제점:**

- 캐시된 Promise를 계속 반환하면 React가 변경을 감지하지 못함
- 이미 페칭된 페이지를 다시 클릭해도 화면이 업데이트되지 않음

**해결 방법:**

- Promise 완료 후 캐시에서 제거
- 다음 요청 시 새로운 Promise 생성
- React가 변경을 감지하고 재렌더링

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

### 5.2 동작 시나리오

1. **블로그 포스트 페이지 접속**

   - `http://localhost:3000/blogs/1` 접속
   - 초기 렌더링: `$Suspense` placeholder 전송
   - 로딩 스피너 표시
   - 데이터 준비 완료: `chunk` 페이로드 전송
   - 포스트 내용 표시

2. **다른 포스트로 네비게이션**

   - "포스트 2" 버튼 클릭
   - `Content` 컴포넌트가 상태 초기화
   - 로딩 스피너 즉시 표시
   - 새로운 RSC 페이로드 요청
   - 데이터 도착 시 포스트 내용 표시

3. **이미 페칭된 포스트 재방문**
   - "포스트 1" 버튼 클릭 (이미 페칭됨)
   - 캐시가 비어있으므로 새로운 Promise 생성
   - React가 변경을 감지하고 재렌더링
   - 로딩 스피너 표시 후 데이터 표시

### 5.3 완료 기준 달성

- ✅ 느린 섹션은 스켈레톤/placeholder 먼저 보이고 뒤이어 본문 스트리밍
- ✅ 동일 location 재요청 시 중복 API 호출 방지
- ✅ 이미 페칭된 페이지 재방문 시 정상적으로 재렌더링
- ✅ React Suspense 메커니즘을 활용한 효율적인 스트리밍

---

## 6. 학습 내용 및 다음 단계

### 6.1 주요 학습 내용

#### React Suspense 메커니즘

- Promise를 throw하여 Suspense 경계 활성화
- Promise가 resolve되면 자동으로 컴포넌트 재렌더링
- 폴링 방식 대신 React의 네이티브 메커니즘 활용

#### 서버 컴포넌트에서 비동기 데이터 페칭

- `async/await`를 사용한 자연스러운 데이터 페칭
- Promise를 반환하면 RSC 렌더러가 자동으로 Suspense 처리
- 서버에서 실행되므로 HTTP 요청 없이 직접 데이터 소스 접근

#### RSC 페이로드 캐싱 전략

- 진행 중인 요청 캐싱으로 중복 호출 방지
- 완료 후 캐시 제거로 재렌더링 보장
- React의 변경 감지 메커니즘과 호환

#### 서버 컴포넌트 제약사항

- 서버 컴포넌트에서 `React.Suspense` 직접 사용 불가
- 클라이언트 컴포넌트에서 Suspense 사용 필요
- RSC 렌더러는 `$Suspense` placeholder만 지원

### 6.2 구현의 한계 (3주차)

- ❌ LRU 캐시 미구현 (현재는 단순 Map 사용)
- ❌ 에러 바운더리 미구현
- ❌ 서버 액션 미구현
- ❌ 로깅 시스템 미구현 (요청 ID, 스트림 청크 타임스탬프)

### 6.3 다음 단계 (4주차)

1. **서버 액션 & DX**

   - 서버 액션 구현
   - HMR 지원
   - 프로덕션 빌드 최적화

2. **에러 처리**

   - 에러 바운더리 구현
   - 친화적인 에러 UI

3. **캐싱 최적화**
   - LRU 캐시 구현
   - 캐시 무효화 전략

---

## 🔗 참고 자료

- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [React 18 Suspense](https://react.dev/reference/react/Suspense)
- [Next.js App Router](https://nextjs.org/docs/app)
- [demystify-react-server-components](https://github.com/JSerZANP/demystify-react-server-components)
