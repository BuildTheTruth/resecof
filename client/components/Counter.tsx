"use client";

import { useState } from "react";

// 클라이언트 컴포넌트 마커 (서버에서 감지용)
function Counter() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("");

  const increment = () => {
    setCount((c) => c + 1);
    setMessage("증가!");
    setTimeout(() => setMessage(""), 1000);
  };

  const decrement = () => {
    setCount((c) => c - 1);
    setMessage("감소!");
    setTimeout(() => setMessage(""), 1000);
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "#f0f0f0",
        borderRadius: "8px",
        marginTop: "15px",
      }}
    >
      <h4 style={{ marginBottom: "15px" }}>🔢 카운터 (클라이언트 컴포넌트)</h4>
      <div
        style={{
          fontSize: "48px",
          fontWeight: "bold",
          textAlign: "center",
          margin: "20px 0",
          color: count > 0 ? "#4caf50" : count < 0 ? "#f44336" : "#333",
        }}
      >
        {count}
      </div>
      {message && (
        <div
          style={{
            textAlign: "center",
            color: "#6200ea",
            fontWeight: "bold",
            marginBottom: "10px",
            animation: "fadeIn 0.3s",
          }}
        >
          {message}
        </div>
      )}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={decrement}
          style={{
            padding: "10px 20px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          -
        </button>
        <button
          onClick={() => {
            setCount(0);
            setMessage("리셋!");
            setTimeout(() => setMessage(""), 1000);
          }}
          style={{
            padding: "10px 20px",
            background: "#757575",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          리셋
        </button>
        <button
          onClick={increment}
          style={{
            padding: "10px 20px",
            background: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          +
        </button>
      </div>
      <p
        style={{
          marginTop: "15px",
          fontSize: "12px",
          color: "#666",
          textAlign: "center",
        }}
      >
        이 컴포넌트는 클라이언트에서 실행됩니다 (상태 관리 가능)
      </p>
    </div>
  );
}

// 클라이언트 컴포넌트 마커 추가
Counter.__isClientComponent = true;

export default Counter;

