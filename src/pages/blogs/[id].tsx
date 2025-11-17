/**
 * 동적 라우트 예제: /blogs/[id]
 *
 * 사용 예시:
 * - /blogs/1 → params.id = "1"
 * - /blogs/hello-world → params.id = "hello-world"
 */

interface BlogPostProps {
  params?: {
    id?: string;
  };
}

export default function BlogPost({ params }: BlogPostProps) {
  const id = params?.id || "없음";

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
        📝 블로그 포스트
      </h1>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "18px", marginBottom: "10px" }}>
          <strong>포스트 ID:</strong> <code>{id}</code>
        </p>
        <p style={{ color: "#666", fontSize: "14px" }}>
          이 페이지는 동적 라우트를 사용합니다. URL의 <code>/blogs/[id]</code>{" "}
          부분에서 <code>id</code> 파라미터를 추출하여 표시합니다.
        </p>
      </div>

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
