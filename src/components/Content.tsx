import React from "react";

/**
 * Content 컴포넌트: RSC 데이터를 표시
 * Promise를 받아서 비동기로 데이터를 로드하고 렌더링
 */
export function Content({ data }: { data: Promise<any> }) {
  const [content, setContent] = React.useState<any>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    data
      .then((result) => {
        if (!cancelled) {
          console.log("📦 Content received:", result);
          setContent(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("❌ Content error:", err);
          setError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data]);

  if (error) {
    return <div style={{ color: "red" }}>에러: {error.message}</div>;
  }

  if (!content) {
    return <div>로딩 중...</div>;
  }

  console.log("🎨 Rendering content:", content);
  return content;
}
