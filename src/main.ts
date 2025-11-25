import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./components/Root.js";
import { LoadingSpinner } from "./components/LoadingSpinner.js";
import { registerComponent } from "./utils/auto-register-components.js";
import { initHMR } from "./utils/hmr-client.js";

// 클라이언트 컴포넌트 자동 등록
// components/index.ts에서 export된 모든 컴포넌트를 import하고 등록
import * as ClientComponents from "./components/index.js";

// 모든 클라이언트 컴포넌트를 자동으로 등록
Object.entries(ClientComponents).forEach(([name, component]) => {
  registerComponent(name, component);
});

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

  // HMR 초기화 (개발 모드에서만)
  initHMR();
}

// DOM이 로드되면 앱 초기화
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
