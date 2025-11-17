import React from "react";

interface AppProps {
  location: string;
  PageComponent?: React.ComponentType<any>;
  params?: Record<string, string>;
}

/**
 * 메인 App 컴포넌트 (서버 컴포넌트)
 *
 * 역할:
 * - location prop을 받아서 적절한 페이지 컴포넌트 렌더링
 * - 네비게이션 바 제공
 * - 파일 기반 라우터에서 로드된 페이지 컴포넌트 렌더링
 *
 * @param location - 현재 경로 (/, /about, /home)
 * @param PageComponent - 파일 기반 라우터에서 로드된 페이지 컴포넌트
 * @param params - 동적 라우트 파라미터 (예: { id: '1' })
 */
export default function App({ location, PageComponent, params }: AppProps) {
  /**
   * 페이지 렌더링: 파일 기반 라우터에서 로드된 컴포넌트 사용
   */
  const renderPage = () => {
    if (PageComponent) {
      // 동적 라우트 파라미터를 props로 전달
      return <PageComponent params={params} />;
    }
    // 폴백: PageComponent가 없는 경우 (하위 호환성)
    return <div>페이지를 찾을 수 없습니다.</div>;
  };

  /**
   * 현재 활성 라우트 확인 (네비게이션 하이라이트용)
   */
  const isHomeActive = location === "/" || location === "/home";
  const isAboutActive = location === "/about";

  return (
    <div>
      {/* 네비게이션 바 */}
      <nav
        style={{
          marginBottom: "30px",
          padding: "15px",
          background: "#6200ea",
          borderRadius: "8px",
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          data-navigate="/home"
          style={{
            padding: "10px 20px",
            background: isHomeActive ? "#fff" : "rgba(255,255,255,0.2)",
            color: isHomeActive ? "#6200ea" : "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            transition: "all 0.2s",
          }}
        >
          Home
        </button>
        <button
          data-navigate="/about"
          style={{
            padding: "10px 20px",
            background: isAboutActive ? "#fff" : "rgba(255,255,255,0.2)",
            color: isAboutActive ? "#6200ea" : "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            transition: "all 0.2s",
          }}
        >
          About
        </button>
      </nav>

      {/* 페이지 콘텐츠 */}
      <main>{renderPage()}</main>

      {/* 푸터 */}
      <footer
        style={{
          marginTop: "40px",
          paddingTop: "20px",
          borderTop: "1px solid #ddd",
          color: "#666",
          fontSize: "14px",
          textAlign: "center",
        }}
      >
        <p>
          React Server Components 미니 프레임워크 - 2주차 | 현재 경로:{" "}
          <code>{location}</code>
        </p>
      </footer>
    </div>
  );
}
