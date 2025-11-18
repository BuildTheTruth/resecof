"use client";

import { getSuspenseChunk } from "../utils/rsc-client.js";

/**
 * Suspense 경계 내부에서 사용할 컴포넌트
 * Promise를 throw하여 Suspense 경계를 활성화
 *
 * React의 Suspense 메커니즘:
 * - Promise를 throw하면 Suspense 경계가 활성화되고 fallback이 표시됨
 * - Promise가 resolve되면 React가 자동으로 컴포넌트를 다시 렌더링
 */
export function SuspenseContent({ chunkId }: { chunkId: string }) {
  // Suspense 청크를 가져오기
  const chunk = getSuspenseChunk(chunkId);

  // 에러가 있으면 throw
  if (chunk.error) {
    throw chunk.error;
  }

  // 데이터가 있으면 반환 (reviveRSCData를 통해 재귀적으로 처리)
  if (chunk.data !== undefined) {
    const finalData = chunk.data;

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
  // React가 Promise가 resolve되면 자동으로 컴포넌트를 다시 렌더링
  throw chunk.promise;
}
