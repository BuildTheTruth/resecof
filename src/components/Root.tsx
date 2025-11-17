"use client";

import React, { Suspense, useState, useTransition } from "react";
import { getRSCPayload } from "../utils/rsc-cache.js";
import { Content } from "./Content.js";

// 현재 위치를 저장하는 전역 상태
let currentLocation = window.location.pathname;

/**
 * Root 컴포넌트
 * - 라우팅 및 네비게이션 처리
 * - RSC 페이로드 관리
 * - 전환 애니메이션 처리
 */
export function Root() {
  const [rscPayload, setRscPayload] = useState(getRSCPayload(currentLocation));
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
