/**
 * useFormStatus 훅
 * React의 useFormStatus를 모방하여 폼 제출 상태를 추적
 */

import React, { useContext, createContext } from "react";

interface FormStatusContextValue {
  pending: boolean;
  data?: any;
  method?: string;
  action?: string | ((formData: FormData) => void | Promise<void>);
}

const FormStatusContext = createContext<FormStatusContextValue | null>(null);

/**
 * 폼 제출 상태를 추적하는 훅
 * React의 useFormStatus를 모방
 *
 * @returns 폼 제출 상태
 *
 * @example
 * ```tsx
 * function SubmitButton() {
 *   const { pending } = useFormStatus();
 *   return <button disabled={pending}>{pending ? "제출 중..." : "제출"}</button>;
 * }
 * ```
 */
export function useFormStatus(): FormStatusContextValue {
  const context = useContext(FormStatusContext);
  if (!context) {
    // FormStatusContext 외부에서는 기본값 반환
    return { pending: false };
  }
  return context;
}

/**
 * FormStatusProvider 컴포넌트
 * 폼 제출 상태를 제공하는 컨텍스트 프로바이더
 */
export function FormStatusProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: FormStatusContextValue;
}) {
  return React.createElement(FormStatusContext.Provider, { value }, children);
}
