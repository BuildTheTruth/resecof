import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import Counter from "./components/Counter.js";
import { registerClientComponent } from "./utils/rsc-client.js";
import { Root } from "./components/Root.js";
import { LoadingSpinner } from "./components/LoadingSpinner.js";

// 클라이언트 컴포넌트 등록
registerClientComponent("Counter", Counter);

// 앱 초기화
function initApp() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);

  // React.Suspense로 감싸서 로딩 상태 처리
  root.render(
    React.createElement(
      Suspense,
      { fallback: React.createElement(LoadingSpinner) },
      React.createElement(Root)
    )
  );

  console.log("✨ React Server Components 클라이언트 초기화 완료");
  console.log("📡 RSC 스트리밍으로 컴포넌트를 받아오고 있습니다");
}

// DOM이 로드되면 앱 초기화
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
