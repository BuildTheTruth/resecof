/**
 * 폼과 서버 액션을 통합하는 유틸리티
 * 점진적 향상 지원 (JavaScript 없이도 작동)
 */

import React, { useState } from "react";
import { FormStatusProvider } from "./use-form-status.js";

/**
 * 서버 액션을 폼의 action prop에 사용할 수 있는 핸들러 생성
 * 점진적 향상을 지원하여 JavaScript 없이도 작동
 *
 * @param serverAction - 서버 액션 함수
 * @param options - 옵션
 * @returns 폼 action 핸들러
 *
 * @example
 * ```tsx
 * <form action={createFormServerAction(likePost, {
 *   onSuccess: (data) => console.log("좋아요 수:", data)
 * })}>
 *   <input type="hidden" name="postId" value="post-123" />
 *   <button type="submit">좋아요</button>
 * </form>
 * ```
 */
export function createFormServerAction<
  T extends (...args: any[]) => Promise<any>
>(
  serverAction: T,
  options?: {
    onSuccess?: (data: ReturnType<T>) => void;
    onError?: (error: Error) => void;
    mapFormData?: (formData: FormData) => Parameters<T>;
  }
) {
  return async (formData: FormData) => {
    // FormData에서 인자 추출
    const mapFormData = options?.mapFormData || defaultMapFormData;
    const args = mapFormData(formData) as Parameters<T>;

    try {
      const result = await serverAction(...args);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      options?.onError?.(err);
      throw err;
    }
  };
}

/**
 * 기본 FormData 매핑 함수
 * 첫 번째 필드 값을 인자로 사용
 */
function defaultMapFormData<T extends (...args: any[]) => Promise<any>>(
  formData: FormData
): Parameters<T> {
  const args: any[] = [];
  for (const [key, value] of formData.entries()) {
    args.push(value);
  }
  return args as Parameters<T>;
}

/**
 * 서버 액션을 사용하는 폼 컴포넌트
 * 점진적 향상을 지원
 *
 * @deprecated 현재 사용되지 않음. 필요시 컴포넌트로 직접 구현하세요.
 */
export function ServerActionForm({
  action,
  children,
  method = "post",
  ...props
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  method?: string;
  [key: string]: any;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      await action(formData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setPending(false);
    }
  };

  return React.createElement(
    FormStatusProvider,
    { value: { pending, method, action }, children: undefined },
    React.createElement(
      "form",
      {
        ...props,
        method,
        onSubmit: handleSubmit,
        action: typeof action === "string" ? action : undefined,
      },
      children,
      error &&
        React.createElement(
          "div",
          { style: { color: "red", marginTop: "8px" } },
          `에러: ${error.message}`
        )
    )
  );
}
