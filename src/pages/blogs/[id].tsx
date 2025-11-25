/**
 * 동적 라우트 예제: /blogs/[id]
 * 서버 컴포넌트에서 데이터 페칭
 *
 * 사용 예시:
 * - /blogs/1 → params.id = "1"
 * - /blogs/hello-world → params.id = "hello-world"
 */

import { getPost } from "../../server/posts.js";
import { getPostLikes } from "../../actions/like.js";
import LikeButton from "../../components/LikeButton.js";

/**
 * 서버 컴포넌트: 비동기 데이터 페칭
 *
 * RSC에서의 데이터 페칭 패턴:
 * 1. async 함수로 선언
 * 2. getPost(id) 같은 데이터 페칭 함수 호출
 * 3. Promise를 반환하면 RSC 렌더러가 자동으로 Suspense 경계 생성
 * 4. 서버에서 실행되므로 HTTP 요청 없이 직접 데이터 소스에 접근
 */
export default async function BlogPost({ params }: { params: { id: string } }) {
  const id = params?.id || "1";

  // 데이터 페칭 함수 호출 (서버에서 실행되므로 HTTP 요청 없음)
  const post = await getPost(id);
  const initialLikes = await getPostLikes(id);

  // 포스트가 없으면 404 처리
  if (!post) {
    return (
      <div
        style={{
          padding: "30px",
          background: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ marginBottom: "20px", color: "#f44336" }}>
          ❌ 포스트를 찾을 수 없습니다
        </h1>
        <p style={{ color: "#666", fontSize: "16px" }}>
          ID <code>{id}</code>에 해당하는 포스트가 존재하지 않습니다.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ marginBottom: "20px", color: "#6200ea" }}>
        📝 {post.title}
      </h1>
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "15px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          <span>
            <strong>작성자:</strong> {post.author}
          </span>
          <span>
            <strong>작성일:</strong> {post.createdAt}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          {post.tags.map((tag: string) => (
            <span
              key={tag}
              style={{
                padding: "4px 12px",
                background: "#e3f2fd",
                color: "#1976d2",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
        <div
          style={{
            padding: "20px",
            background: "#f5f5f5",
            borderRadius: "6px",
            lineHeight: "1.8",
            fontSize: "16px",
          }}
        >
          {post.content}
        </div>
      </div>

      {/* 좋아요 버튼 (서버 액션 사용) */}
      <LikeButton postId={id} initialLikes={initialLikes} />

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "#f5f5f5",
          borderRadius: "6px",
        }}
      >
        <h2 style={{ marginBottom: "15px", fontSize: "20px" }}>
          다른 포스트 보기
        </h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            data-navigate="/blogs/1"
            style={{
              padding: "10px 20px",
              background: "#6200ea",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            포스트 1
          </button>
          <button
            data-navigate="/blogs/2"
            style={{
              padding: "10px 20px",
              background: "#6200ea",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            포스트 2
          </button>
          <button
            data-navigate="/blogs/3"
            style={{
              padding: "10px 20px",
              background: "#6200ea",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            포스트 3
          </button>
          <button
            data-navigate="/blogs/hello-world"
            style={{
              padding: "10px 20px",
              background: "#6200ea",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            hello-world
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          background: "#e3f2fd",
          borderRadius: "6px",
          borderLeft: "4px solid #2196f3",
        }}
      >
        <h3 style={{ marginBottom: "10px", fontSize: "16px" }}>
          💡 동적 라우팅 작동 방식
        </h3>
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px" }}>
          <li>
            파일명: <code>blogs/[id].tsx</code>
          </li>
          <li>
            URL 패턴: <code>/blogs/:id</code>
          </li>
          <li>
            파라미터 접근: <code>props.params.id</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
