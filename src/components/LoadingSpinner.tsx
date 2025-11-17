"use client";

/**
 * 로딩 스피너 컴포넌트
 * RSC 페이로드 로딩 중 표시
 */
export function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
        color: "#666",
        fontSize: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #6200ea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        >
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
        <div>RSC 페이로드 로딩 중...</div>
      </div>
    </div>
  );
}
