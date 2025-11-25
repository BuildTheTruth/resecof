/**
 * 클라이언트에서 서버 액션을 호출하는 유틸리티
 * React의 서버 액션 스타일을 모방
 */

/**
 * 서버 액션 호출 결과 타입
 */
export type ServerActionResult<T> =
  | { type: "success"; data: T }
  | { type: "error"; error: string };

/**
 * 서버 액션을 호출하는 함수
 * @param actionId - 액션 ID (예: "actions/like")
 * @param functionName - 함수명 (예: "likePost")
 * @param args - 함수 인자
 * @returns 서버 액션 실행 결과
 */
export async function callServerAction<T = any>(
  actionId: string,
  functionName: string,
  ...args: any[]
): Promise<ServerActionResult<T>> {
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
      return {
        type: "error",
        error: result.error || "Unknown error",
      };
    }

    return {
      type: "success",
      data: result.data,
    };
  } catch (error) {
    return {
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 서버 액션 함수를 래핑하여 클라이언트에서 호출 가능하게 만드는 헬퍼
 * React의 "use server" 스타일을 모방
 *
 * @param actionId - 액션 ID (예: "actions/like")
 * @param serverFunction - 서버에서 실행될 함수
 * @returns 클라이언트에서 호출 가능한 래핑된 함수
 *
 * @example
 * ```ts
 * // 서버 액션 정의 (actions/like.ts)
 * export async function likePost(postId: string): Promise<number> {
 *   // 서버에서 실행되는 코드
 *   return newLikes;
 * }
 *
 * // 클라이언트에서 사용
 * const likePostAction = createServerAction("actions/like", likePost);
 * const result = await likePostAction("post-123");
 * ```
 */
export function createServerAction<T extends (...args: any[]) => Promise<any>>(
  actionId: string,
  serverFunction: T
): T {
  // 함수명 추출 (함수 이름을 사용)
  const functionName = serverFunction.name || "default";

  // 클라이언트에서 호출될 래핑 함수
  const wrappedFunction = async (
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> => {
    const result = await callServerAction<ReturnType<T>>(
      actionId,
      functionName,
      ...args
    );

    if (result.type === "error") {
      throw new Error(result.error);
    }

    return result.data;
  };

  // 원본 함수의 이름과 속성 유지
  Object.defineProperty(wrappedFunction, "name", {
    value: functionName,
    writable: false,
  });

  return wrappedFunction as T;
}

/**
 * 폼의 action prop에 사용할 수 있는 서버 액션 핸들러 생성
 * React의 서버 액션 폼 스타일을 모방
 *
 * @param actionId - 액션 ID
 * @param functionName - 함수명
 * @param onSuccess - 성공 시 콜백
 * @param onError - 에러 시 콜백
 * @returns 폼 이벤트 핸들러
 *
 * @example
 * ```tsx
 * <form action={createFormAction("actions/like", "likePost", (data) => {
 *   console.log("좋아요 수:", data);
 * })}>
 *   <input type="hidden" name="postId" value="post-123" />
 *   <button type="submit">좋아요</button>
 * </form>
 * ```
 */
export function createFormAction(
  actionId: string,
  functionName: string,
  onSuccess?: (data: any) => void,
  onError?: (error: string) => void
) {
  return async (formData: FormData) => {
    // FormData에서 인자 추출
    // 간단한 구현: 첫 번째 필드 값을 인자로 사용
    const args: any[] = [];
    for (const [key, value] of formData.entries()) {
      args.push(value);
    }

    const result = await callServerAction(actionId, functionName, ...args);

    if (result.type === "success") {
      onSuccess?.(result.data);
    } else {
      onError?.(result.error);
    }
  };
}
