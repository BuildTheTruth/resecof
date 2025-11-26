/**
 * 서버 액션 래퍼 생성 유틸리티
 * 서버 액션 함수를 클라이언트에서 직접 import 가능하도록 래핑
 */

/**
 * 서버 액션 함수를 클라이언트에서 호출 가능한 함수로 변환
 * 빌드 타임에 자동으로 생성되거나, 런타임에 동적으로 생성
 * 
 * @param actionId - 액션 ID (예: "actions/like")
 * @param functionName - 함수명 (예: "likePost")
 * @returns 클라이언트에서 호출 가능한 래핑된 함수
 */
export function createServerActionWrapper<T extends (...args: any[]) => Promise<any>>(
  actionId: string,
  functionName: string
): T {
  const wrappedFunction = async (
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> => {
    try {
      const response = await fetch("/_actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actionId,
          functionName,
          args,
        }),
      });

      const result = await response.json();

      if (result.type === "error") {
        throw new Error(result.error || "Unknown error");
      }

      return result.data;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  };

  // 원본 함수의 이름과 속성 유지
  Object.defineProperty(wrappedFunction, "name", {
    value: functionName,
    writable: false,
  });

  return wrappedFunction as T;
}

