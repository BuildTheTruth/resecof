"use client";

import { useState, useEffect } from "react";
import { getSuspenseChunk } from "../utils/rsc-client.js";

/**
 * Suspense 경계 내부에서 사용할 컴포넌트
 * Promise를 throw하여 Suspense 경계를 활성화
 */
export function SuspenseContent({ chunkId }: { chunkId: string }) {
  const [, forceUpdate] = useState(0);

  // Suspense 청크를 가져오기
  const chunk = getSuspenseChunk(chunkId);

  // Promise를 구독하여 데이터가 도착하면 강제로 다시 렌더링
  useEffect(() => {
    const currentChunk = getSuspenseChunk(chunkId);
    console.log(`🔍 SuspenseContent useEffect: ${chunkId}`, {
      hasPromise: !!currentChunk.promise,
      hasData: currentChunk.data !== undefined,
      hasError: !!currentChunk.error,
    });

    if (
      currentChunk.promise &&
      currentChunk.data === undefined &&
      !currentChunk.error
    ) {
      console.log(`⏳ Promise 구독 시작: ${chunkId}`);
      currentChunk.promise
        .then((data) => {
          console.log(`✅ Promise resolve: ${chunkId}`, data);
          // Promise가 resolve되면 강제로 다시 렌더링
          forceUpdate((prev) => prev + 1);
        })
        .catch((err) => {
          console.error(`❌ Promise reject: ${chunkId}`, err);
          // 에러가 발생해도 강제로 다시 렌더링
          forceUpdate((prev) => prev + 1);
        });
    }
  }, [chunkId]);

  console.log(`🎨 SuspenseContent 렌더링: ${chunkId}`, {
    hasData: chunk.data !== undefined,
    hasError: !!chunk.error,
    hasPromise: !!chunk.promise,
  });

  // 에러가 있으면 throw
  if (chunk.error) {
    throw chunk.error;
  }

  // 데이터가 있으면 반환
  if (chunk.data !== undefined) {
    const finalData = chunk.data;
    console.log(`📦 데이터 반환: ${chunkId}`, finalData);

    // 데이터가 React 요소인지 확인
    // reviveRSCData를 통해 처리된 데이터는 이미 React 요소일 수 있음
    if (
      finalData &&
      typeof finalData === "object" &&
      (finalData.$$typeof === Symbol.for("react.element") ||
        finalData.$$typeof?.toString().includes("react.element") ||
        finalData.type)
    ) {
      return finalData;
    }

    // 그 외의 경우는 그대로 반환 (문자열, 숫자 등)
    return finalData;
  }

  // 데이터가 없으면 Promise를 throw하여 Suspense 경계 활성화
  // React가 Promise가 resolve되면 자동으로 다시 렌더링
  console.log(`⏸️ Promise throw: ${chunkId}`);
  throw chunk.promise;
}
