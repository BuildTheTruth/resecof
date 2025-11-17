/**
 * 가짜 데이터 소스
 * 실제 DB나 외부 API 대신 사용하는 테스트 데이터
 */

// 가짜 지연 함수 (실제 네트워크 지연 시뮬레이션)
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 가짜 블로그 포스트 데이터
export const FAKE_POSTS = [
  {
    id: "1",
    title: "React Server Components 소개",
    content:
      "React Server Components는 서버에서 렌더링되는 새로운 컴포넌트 모델입니다. 클라이언트 번들 크기를 줄이고 서버 리소스를 활용할 수 있습니다.",
    author: "홍길동",
    createdAt: "2024-01-15",
    tags: ["React", "RSC", "서버 컴포넌트"],
  },
  {
    id: "2",
    title: "데이터 페칭과 Suspense",
    content:
      "Suspense를 사용하면 비동기 데이터 로딩을 더 우아하게 처리할 수 있습니다. 서버 컴포넌트에서 Promise를 반환하면 자동으로 Suspense 경계가 생성됩니다.",
    author: "김철수",
    createdAt: "2024-01-20",
    tags: ["React", "Suspense", "비동기"],
  },
  {
    id: "3",
    title: "RSC 캐싱 전략",
    content:
      "Flight 응답을 캐싱하면 동일한 요청에 대해 빠르게 응답할 수 있습니다. location과 params를 키로 사용하여 캐시를 관리합니다.",
    author: "이영희",
    createdAt: "2024-01-25",
    tags: ["RSC", "캐싱", "성능"],
  },
  {
    id: "hello-world",
    title: "Hello World",
    content:
      "이것은 동적 라우트 예제입니다. URL 파라미터로 다양한 ID를 받아서 처리할 수 있습니다.",
    author: "개발자",
    createdAt: "2024-02-01",
    tags: ["예제", "라우팅"],
  },
];

// 가짜 사용자 데이터
export const FAKE_USERS = [
  { id: "1", name: "홍길동", email: "hong@example.com", bio: "React 개발자" },
  {
    id: "2",
    name: "김철수",
    email: "kim@example.com",
    bio: "프론트엔드 엔지니어",
  },
  { id: "3", name: "이영희", email: "lee@example.com", bio: "풀스택 개발자" },
];
