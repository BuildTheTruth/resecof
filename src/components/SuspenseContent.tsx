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
    if (
      currentChunk.promise &&
      currentChunk.data === undefined &&
      !currentChunk.error
    ) {
      currentChunk.promise
        .then(() => {
          // Promise가 resolve되면 강제로 다시 렌더링
          forceUpdate((prev) => prev + 1);
        })
        .catch(() => {
          // 에러가 발생해도 강제로 다시 렌더링
          forceUpdate((prev) => prev + 1);
        });
    }
  }, [chunkId]);

  // 에러가 있으면 throw
  if (chunk.error) {
    throw chunk.error;
  }

  // 데이터가 있으면 반환
  if (chunk.data !== undefined) {
    const finalData = chunk.data;

    // 데이터가 React 요소이면 그대로 반환
    if (
      finalData &&
      typeof finalData === "object" &&
      (finalData.$$typeof || finalData.type)
    ) {
      return finalData;
    }

    // 그 외의 경우는 그대로 반환 (문자열, 숫자 등)
    return finalData;
  }

  // 데이터가 없으면 Promise를 throw하여 Suspense 경계 활성화
  // React가 Promise가 resolve되면 자동으로 다시 렌더링
  throw chunk.promise;
}
