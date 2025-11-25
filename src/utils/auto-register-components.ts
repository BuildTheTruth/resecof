/**
 * 클라이언트 컴포넌트 자동 등록 유틸리티
 * 컴포넌트를 import하여 자동으로 등록
 */

import { registerClientComponent } from "./rsc-client.js";

/**
 * 클라이언트 컴포넌트를 자동으로 등록하는 헬퍼 함수
 * 컴포넌트 객체와 이름을 받아서 등록
 *
 * @param componentName - 컴포넌트 이름
 * @param component - 컴포넌트 객체
 */
export function registerComponent(componentName: string, component: any): void {
  if (component) {
    registerClientComponent(componentName, component);
    console.log(`✅ 클라이언트 컴포넌트 등록: ${componentName}`);
  } else {
    console.warn(`⚠️ 컴포넌트가 없음: ${componentName}`);
  }
}
