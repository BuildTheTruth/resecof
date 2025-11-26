"use client";

import { useState } from "react";
import { likePost } from "../actions/like.client.js";
import { useServerAction } from "../utils/use-server-action.js";

/**
 * 좋아요 버튼 클라이언트 컴포넌트
 * 개선된 서버 액션 API를 사용하여 좋아요 기능 구현
 */
export default function LikeButton({
  postId,
  initialLikes,
}: {
  postId: string;
  initialLikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [executeLike, isPending, error] = useServerAction(likePost);

  const handleLike = async () => {
    try {
      const newLikes = await executeLike(postId);
      if (newLikes !== undefined) {
        setLikes(newLikes);
      }
    } catch (err) {
      // 에러는 useServerAction에서 이미 처리됨
      console.error("좋아요 실패:", err);
    }
  };

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        background: "#f5f5f5",
        borderRadius: "6px",
        border: "1px solid #e0e0e0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <button
          onClick={handleLike}
          disabled={isPending}
          style={{
            padding: "10px 20px",
            background: isPending ? "#ccc" : "#e91e63",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isPending ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "background 0.2s",
          }}
        >
          {isPending ? "⏳" : "❤️"}
          {isPending ? "처리 중..." : "좋아요"}
        </button>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#e91e63",
          }}
        >
          {likes}개
        </div>
      </div>
      {error && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px",
            background: "#ffebee",
            color: "#c62828",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          ❌ 에러: {error.message}
        </div>
      )}
      <p
        style={{
          marginTop: "10px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        💡 서버 액션을 사용하여 좋아요 수를 업데이트합니다. 페이지 새로고침 없이
        상태가 반영됩니다.
      </p>
    </div>
  );
}
