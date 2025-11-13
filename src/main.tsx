import React, { Suspense, useState, useTransition } from "react";
import { createRoot } from "react-dom/client";
import Counter from "./components/Counter.js";
import { fetchRSC, registerClientComponent } from "./utils/rsc-client.js";

// 클라이언트 컴포넌트 등록
registerClientComponent("Counter", Counter);

// 현재 위치를 저장하는 전역 상태
let currentLocation = window.location.pathname;

// RSC Cache
const rscCache = new Map<string, Promise<any>>();

// RSC 페이로드를 가져오는 함수 (캐싱 포함)
function getRSCPayload(location: string) {
  if (!rscCache.has(location)) {
    rscCache.set(location, fetchRSC(location));
  }
  return rscCache.get(location)!;
}

// 초기 RSC 페이로드
let initialRSCPayload = getRSCPayload(currentLocation);

// Content 컴포넌트: RSC 데이터를 표시
function Content({ data }: { data: Promise<any> }) {
  const [content, setContent] = React.useState<any>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    data
      .then((result) => {
        if (!cancelled) {
          console.log("📦 Content received:", result);
          setContent(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("❌ Content error:", err);
          setError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data]);

  if (error) {
    return <div style={{ color: "red" }}>에러: {error.message}</div>;
  }

  if (!content) {
    return <div>로딩 중...</div>;
  }

  console.log("🎨 Rendering content:", content);
  return content;
}

// Root 컴포넌트
function Root() {
  const [rscPayload, setRscPayload] = useState(initialRSCPayload);
  const [isPending, startTransition] = useTransition();

  // 네비게이션 핸들러
  const navigate = (newLocation: string) => {
    if (newLocation === currentLocation) return;

    currentLocation = newLocation;
    window.history.pushState({}, "", newLocation);

    // Transition으로 감싸서 부드러운 전환
    startTransition(() => {
      const newPayload = getRSCPayload(newLocation);
      setRscPayload(newPayload);
    });
  };

  // popstate 이벤트 핸들러 (뒤로가기/앞으로가기)
  React.useEffect(() => {
    const handlePopState = () => {
      const newLocation = window.location.pathname;
      if (newLocation !== currentLocation) {
        currentLocation = newLocation;
        startTransition(() => {
          const newPayload = getRSCPayload(newLocation);
          setRscPayload(newPayload);
        });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 버튼 클릭 이벤트 위임
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("[data-navigate]") as HTMLElement;

      if (button) {
        e.preventDefault();
        const newLocation = button.getAttribute("data-navigate");
        if (newLocation) {
          navigate(newLocation);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {isPending && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #6200ea, #b388ff)",
            animation: "slideIn 0.3s ease-out",
            zIndex: 1000,
          }}
        >
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}
      <div style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
        <Suspense fallback={<div>Suspense 로딩...</div>}>
          <Content data={rscPayload} />
        </Suspense>
      </div>
    </div>
  );
}

// 앱 초기화
function initApp() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);

  // React.Suspense로 감싸서 로딩 상태 처리
  root.render(
    <Suspense
      fallback={
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
      }
    >
      <Root />
    </Suspense>
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
