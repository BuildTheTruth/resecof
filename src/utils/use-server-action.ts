/**
 * React 훅을 사용한 서버 액션 통합
 * useTransition과 통합
 */

import { useTransition, useState } from "react";

/**
 * 서버 액션을 useTransition과 통합하여 사용하는 훅
 *
 * @param serverAction - 서버 액션 함수
 * @returns [실행 함수, isPending, error]
 *
 * @example
 * ```tsx
 * const [likePost, isPending, error] = useServerAction(likePostAction);
 *
 * <button onClick={() => likePost(postId)} disabled={isPending}>
 *   {isPending ? "처리 중..." : "좋아요"}
 * </button>
 * ```
 */
export function useServerAction<T extends (...args: any[]) => Promise<any>>(
  serverAction: T
): [
  (...args: Parameters<T>) => Promise<ReturnType<T> | undefined>,
  boolean,
  Error | null
] {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const execute = async (
    ...args: Parameters<T>
  ): Promise<ReturnType<T> | undefined> => {
    setError(null);

    return new Promise((resolve) => {
      startTransition(() => {
        (async () => {
          try {
            const result = await serverAction(...args);
            resolve(result);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            resolve(undefined);
          }
        })();
      });
    });
  };

  return [execute, isPending, error];
}
