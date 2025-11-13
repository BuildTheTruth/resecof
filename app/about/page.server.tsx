import React from "react";

// 클라이언트 컴포넌트 래퍼
function ClientComponent({
  componentName,
  ...props
}: {
  componentName: string;
  [key: string]: any;
}) {
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

/**
 * 서버 컴포넌트: About 페이지
 *
 * 서버 컴포넌트의 장점을 보여주는 예제:
 * - 서버 시간을 직접 생성 (서버 리소스 활용)
 * - 서버에서 렌더링된 콘텐츠를 클라이언트로 전송
 */
export default function About() {
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
        <h3>2주차 구현 목표:</h3>
        <ul style={{ marginTop: "10px", marginLeft: "20px" }}>
          <li>
            ✅ <code>renderToRSCStream</code>으로 Flight 스트림 생성
          </li>
          <li>
            ✅ <code>fetchRSC</code> + <code>useState</code>로 점진 복원
          </li>
          <li>
            ✅ 파일 기반 라우팅: <code>app/home/page.server.tsx</code> →{" "}
            <code>/</code>
          </li>
          <li>✅ Accept 헤더로 HTML/RSC 요청 구분</li>
          <li>✅ "use client" 컴포넌트 연결</li>
          <li>✅ 서버/클라이언트 번들 분리</li>
          <li>✅ 클라이언트 매니페스트 생성</li>
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
