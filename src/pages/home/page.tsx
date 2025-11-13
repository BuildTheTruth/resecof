import React from "react";
// 클라이언트 컴포넌트를 직접 import
// 서버 번들에서는 external로 처리되고, 클라이언트 번들에 포함됨
import Counter from "../../components/Counter.js";

/**
 * 서버 컴포넌트: Home 페이지
 *
 * 특징:
 * - 서버에서 실행되므로 클라이언트 번들에 포함되지 않음
 * - 서버 리소스(파일 시스템, 데이터베이스)에 접근 가능
 * - 상태(state)를 사용할 수 없음
 */
export default function Home() {
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
