import React from "react";
import Counter from "./Counter.client.js";

interface AppProps {
  location: string;
}

// 서버 컴포넌트: Home 페이지
function Home() {
  return (
    <div>
      <h1>🏠 Home 페이지</h1>
      <p>React Server Components 미니 프레임워크에 오신 것을 환영합니다!</p>
      <p>
        이 페이지는 <strong>서버 컴포넌트</strong>로 렌더링됩니다.
      </p>
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          background: "#e3f2fd",
          borderRadius: "8px",
        }}
      >
        <h3>특징:</h3>
        <ul style={{ marginTop: "10px", marginLeft: "20px" }}>
          <li>서버에서 렌더링되는 컴포넌트</li>
          <li>클라이언트 JavaScript 번들에 포함되지 않음</li>
          <li>데이터베이스나 파일 시스템에 직접 접근 가능</li>
          <li>민감한 정보를 안전하게 처리 가능</li>
        </ul>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>클라이언트 컴포넌트 예제:</h3>
        <Counter />
      </div>
    </div>
  );
}

// 서버 컴포넌트: About 페이지
function About() {
  const serverTime = new Date().toLocaleString("ko-KR");

  return (
    <div>
      <h1>ℹ️ About 페이지</h1>
      <p>이 프로젝트는 React Server Components의 최소 구현입니다.</p>
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          background: "#fff3e0",
          borderRadius: "8px",
        }}
      >
        <h3>1주차 목표:</h3>
        <ul style={{ marginTop: "10px", marginLeft: "20px" }}>
          <li>
            ✅ <code>renderToPipeableStream</code>으로 Flight 스트림 생성
          </li>
          <li>
            ✅ <code>createFromFetch</code> + <code>use()</code>로 점진 복원
          </li>
          <li>
            ✅ 최소 라우팅: <code>/react?location=...</code>
          </li>
          <li>✅ "use client" 컴포넌트 연결</li>
        </ul>
      </div>
      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <p>
          <strong>서버 시간:</strong> {serverTime}
        </p>
        <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
          이 시간은 서버에서 생성되었습니다. 페이지를 새로고침하면 변경됩니다.
        </p>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>상태를 가진 클라이언트 컴포넌트:</h3>
        <Counter />
      </div>
    </div>
  );
}

// 메인 App 컴포넌트 (서버 컴포넌트)
export default function App({ location }: AppProps) {
  // 간단한 라우팅 로직
  const renderPage = () => {
    switch (location) {
      case "/about":
        return <About />;
      case "/":
      default:
        return <Home />;
    }
  };

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
          data-navigate="/"
          style={{
            padding: "10px 20px",
            background: location === "/" ? "#fff" : "rgba(255,255,255,0.2)",
            color: location === "/" ? "#6200ea" : "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          Home
        </button>
        <button
          data-navigate="/about"
          style={{
            padding: "10px 20px",
            background:
              location === "/about" ? "#fff" : "rgba(255,255,255,0.2)",
            color: location === "/about" ? "#6200ea" : "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
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
        }}
      >
        <p>React Server Components 미니 프레임워크 - 1주차</p>
      </footer>
    </div>
  );
}
