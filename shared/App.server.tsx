import React from "react";

// 클라이언트 컴포넌트 래퍼: 서버에서는 컴포넌트 이름만 전달
// 실제 컴포넌트는 클라이언트에서 로드됨
function ClientComponent({
  componentName,
  ...props
}: {
  componentName: string;
  [key: string]: any;
}) {
  // 서버에서는 클라이언트 컴포넌트를 실행하지 않고 마킹만 함
  // rsc-renderer에서 이 컴포넌트를 감지하여 클라이언트 컴포넌트로 변환
  return React.createElement("div", {
    "data-client-component": componentName,
    ...props,
  } as any);
}

// Counter 컴포넌트 래퍼
function Counter(props: any) {
  return React.createElement(ClientComponent, {
    componentName: "Counter",
    ...props,
  });
}

interface AppProps {
  location: string;
}

/**
 * 서버 컴포넌트: Home 페이지
 *
 * 특징:
 * - 서버에서 실행되므로 클라이언트 번들에 포함되지 않음
 * - 서버 리소스(파일 시스템, 데이터베이스)에 접근 가능
 * - 상태(state)를 사용할 수 없음
 */
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
        <h3>서버 컴포넌트의 특징:</h3>
        <ul style={{ marginTop: "10px", marginLeft: "20px" }}>
          <li>✅ 서버에서 렌더링되어 클라이언트로 전송됨</li>
          <li>✅ 클라이언트 JavaScript 번들에 포함되지 않음</li>
          <li>✅ 데이터베이스나 파일 시스템에 직접 접근 가능</li>
          <li>✅ 민감한 정보를 안전하게 처리 가능</li>
          <li>✅ 서버 리소스를 활용한 빠른 렌더링</li>
        </ul>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>클라이언트 컴포넌트 예제:</h3>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
          아래 Counter 컴포넌트는 클라이언트에서 실행되며 상태를 가질 수
          있습니다.
        </p>
        <Counter />
      </div>
    </div>
  );
}

/**
 * 서버 컴포넌트: About 페이지
 *
 * 서버 컴포넌트의 장점을 보여주는 예제:
 * - 서버 시간을 직접 생성 (서버 리소스 활용)
 * - 서버에서 렌더링된 콘텐츠를 클라이언트로 전송
 */
function About() {
  // 서버에서 시간을 생성 (매 요청마다 최신 시간)
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
        <h3>1주차 구현 목표:</h3>
        <ul style={{ marginTop: "10px", marginLeft: "20px" }}>
          <li>
            ✅ <code>renderToRSCStream</code>으로 Flight 스트림 생성
          </li>
          <li>
            ✅ <code>fetchRSC</code> + <code>useState</code>로 점진 복원
          </li>
          <li>
            ✅ 직접 라우팅: <code>/</code>, <code>/about</code>,{" "}
            <code>/home</code>
          </li>
          <li>✅ Accept 헤더로 HTML/RSC 요청 구분</li>
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
          이 시간은 <strong>서버에서 생성</strong>되었습니다. 페이지를
          새로고침하거나 다시 방문하면 최신 시간으로 업데이트됩니다.
        </p>
        <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
          서버 컴포넌트는 매 요청마다 실행되므로, 항상 최신 데이터를 제공할 수
          있습니다.
        </p>
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>상태를 가진 클라이언트 컴포넌트:</h3>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
          서버 컴포넌트는 클라이언트 컴포넌트를 자식으로 가질 수 있습니다.
        </p>
        <Counter />
      </div>
    </div>
  );
}

/**
 * 메인 App 컴포넌트 (서버 컴포넌트)
 *
 * 역할:
 * - location prop을 받아서 적절한 페이지 컴포넌트 렌더링
 * - 네비게이션 바 제공
 * - 라우팅 로직 처리
 *
 * @param location - 현재 경로 (/, /about, /home)
 */
export default function App({ location }: AppProps) {
  /**
   * 라우팅 로직: location에 따라 적절한 페이지 컴포넌트 반환
   */
  const renderPage = () => {
    switch (location) {
      case "/about":
        return <About />;
      case "/home":
      case "/":
      default:
        return <Home />;
    }
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
          React Server Components 미니 프레임워크 - 1주차 | 현재 경로:{" "}
          <code>{location}</code>
        </p>
      </footer>
    </div>
  );
}
