/**
 * RSC 클라이언트 - createFromFetch를 모방한 간단한 구현
 * 실제 React Server Components는 더 복잡하지만, 1주차 목표를 위한 최소 구현
 */

import { createElement, Suspense } from "react";
import { SuspenseContent } from "../components/SuspenseContent.js";

interface RSCPayload {
  type: string;
  data?: any;
  id?: string;
  clientComponents?: string[];
  error?: string;
}

// Suspense 청크를 추적하는 전역 맵
const suspenseChunks = new Map<
  string,
  {
    promise: Promise<any>;
    resolve: (data: any) => void;
    reject: (error: Error) => void;
    data?: any;
    error?: Error;
  }
>();

/**
 * Suspense 청크 타입
 */
export type SuspenseChunk = {
  promise: Promise<any>;
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  data?: any;
  error?: Error;
};

/**
 * Suspense 청크를 가져오는 함수
 * 청크가 없으면 생성하고, 청크 객체를 반환
 */
export function getSuspenseChunk(chunkId: string): SuspenseChunk {
  let chunk = suspenseChunks.get(chunkId);

  if (!chunk) {
    console.log(`🆕 새 Suspense 청크 생성: ${chunkId}`);
    // 새로운 청크 생성
    let resolve: (data: any) => void;
    let reject: (error: Error) => void;
    const promise = new Promise<any>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    chunk = {
      promise,
      resolve: resolve!,
      reject: reject!,
    };
    suspenseChunks.set(chunkId, chunk);
  }

  return chunk;
}

/**
 * RSC 스트림을 가져와서 Promise로 변환
 * createFromFetch를 모방
 */
export async function fetchRSC(location: string): Promise<any> {
  // location이 "/"인 경우도 그대로 사용
  const path =
    location === "/"
      ? "/"
      : location.startsWith("/")
      ? location
      : `/${location}`;

  // RSC 요청임을 명시 (서버에서 HTML과 구분하기 위해)
  const response = await fetch(path, {
    headers: {
      Accept: "text/x-component",
    },
  });

  if (!response.ok) {
    throw new Error(`RSC fetch failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let rootData: any = null;
  const pendingChunks = new Map<string, (data: any) => void>();

  // 스트림 읽기
  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 줄 단위로 처리 (각 줄이 JSON 객체)
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // 마지막 불완전한 줄은 보관

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const payload: RSCPayload = JSON.parse(line);

        if (payload.type === "root") {
          console.log("📦 RSC root payload received");
          rootData = reviveRSCData(
            payload.data,
            payload.clientComponents || []
          );
          console.log("✅ RSC data revived:", rootData);
        } else if (payload.type === "chunk" && payload.id) {
          // 비동기 청크 처리
          console.log(`📥 청크 수신: ${payload.id}`, {
            suspenseChunksSize: suspenseChunks.size,
            hasChunk: suspenseChunks.has(payload.id),
            allChunkIds: Array.from(suspenseChunks.keys()),
          });

          // root payload의 clientComponents를 사용하여 클라이언트 컴포넌트 정보 유지
          const revived = reviveRSCData(
            payload.data,
            payload.clientComponents || []
          );

          // 기존 resolver가 있으면 호출 (하위 호환성)
          const resolver = pendingChunks.get(payload.id);
          if (resolver) {
            resolver(revived);
            pendingChunks.delete(payload.id);
          }

          // Suspense 청크 처리
          const chunk = suspenseChunks.get(payload.id);
          if (chunk) {
            console.log(`✅ Suspense 청크 도착: ${payload.id}`, revived);
            chunk.data = revived;
            chunk.resolve(revived);
          } else {
            console.warn(`⚠️ Suspense 청크를 찾을 수 없음: ${payload.id}`, {
              suspenseChunksSize: suspenseChunks.size,
              allChunkIds: Array.from(suspenseChunks.keys()),
            });
            // 청크가 없으면 생성하고 데이터 설정
            const newChunk = getSuspenseChunk(payload.id);
            newChunk.data = revived;
            newChunk.resolve(revived);
            console.log(`✅ 새 청크 생성 및 데이터 설정: ${payload.id}`);
          }
        } else if (payload.type === "error") {
          console.error("RSC Error:", payload.error);
          const error = new Error(payload.error || "Unknown RSC error");

          // Suspense 청크 에러 처리
          if (payload.id) {
            const chunk = suspenseChunks.get(payload.id);
            if (chunk) {
              chunk.error = error;
              chunk.reject(error);
            }
          }

          throw error;
        }
      } catch (error) {
        console.error("Failed to parse RSC payload:", error);
      }
    }
  }

  return rootData;
}

/**
 * RSC 데이터를 React 요소로 복원
 */
function reviveRSCData(data: any, clientComponents: string[]): any {
  if (data == null || typeof data === "boolean") {
    return null;
  }

  if (typeof data === "string" || typeof data === "number") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => reviveRSCData(item, clientComponents));
  }

  if (typeof data === "object") {
    // React Element 복원
    if (
      data.$$typeof === "Symbol(react.element)" ||
      data.$$typeof?.includes?.("react.element")
    ) {
      let type = data.type;
      let props: any = {};

      // 클라이언트 컴포넌트 처리
      if (data.type === "$ClientComponent") {
        const componentName = data.props?.$componentName;
        if (componentName) {
          // 동적으로 클라이언트 컴포넌트 로드
          type = loadClientComponent(componentName);
          // $componentName을 제외한 나머지 props 복원
          const otherProps = Object.keys(data.props || {})
            .filter((k) => k !== "$componentName")
            .reduce((acc, k) => ({ ...acc, [k]: data.props[k] }), {});
          props = reviveRSCData(otherProps, clientComponents);
        }
      } else if (data.type === "$Suspense") {
        // Suspense placeholder - 실제 React.Suspense로 변환
        const chunkId = data.props?.id;
        if (chunkId) {
          // Suspense 경계 내부에 Promise를 throw하는 컴포넌트 배치
          // React Suspense는 fallback이 필수이므로 기본 fallback 제공
          // 상위 컴포넌트에서 fallback을 주입하려면 Suspense를 감싸야 함
          type = Suspense;
          props = {
            fallback: null, // fallback이 null이어도 Suspense는 동작함
            children: createElement(SuspenseContent, { chunkId }),
          };
        } else {
          // chunkId가 없으면 기본 처리
          type = Suspense;
          props = {
            fallback: null,
            children: null,
          };
        }
      } else {
        // props 복원 (children 포함)
        const restoredProps = reviveRSCData(data.props, clientComponents);
        props = restoredProps || {};
      }

      // React.createElement를 사용하여 실제 React 요소 생성
      const children = props.children;
      delete props.children;

      // children이 있으면 createElement에 전달, 없으면 props만
      if (children !== undefined) {
        if (Array.isArray(children)) {
          return createElement(type, props, ...children);
        } else {
          return createElement(type, props, children);
        }
      } else {
        return createElement(type, props);
      }
    }

    // 일반 객체 (style 등)
    const result: any = {};
    for (const key in data) {
      result[key] = reviveRSCData(data[key], clientComponents);
    }
    return result;
  }

  return data;
}

/**
 * 클라이언트 컴포넌트 로드
 */
const clientComponentCache = new Map<string, any>();

function loadClientComponent(componentName: string): any {
  if (clientComponentCache.has(componentName)) {
    return clientComponentCache.get(componentName);
  }

  // 클라이언트 컴포넌트는 빌드 시 번들에 포함됨
  // 여기서는 동적 import를 사용할 수 없으므로, 전역 레지스트리 사용
  const component = (window as any).__CLIENT_COMPONENTS__?.[componentName];

  if (!component) {
    console.warn(`Client component not found: ${componentName}`);
    return "div"; // fallback
  }

  clientComponentCache.set(componentName, component);
  return component;
}

/**
 * 클라이언트 컴포넌트 등록
 */
export function registerClientComponent(name: string, component: any) {
  if (!(window as any).__CLIENT_COMPONENTS__) {
    (window as any).__CLIENT_COMPONENTS__ = {};
  }
  (window as any).__CLIENT_COMPONENTS__[name] = component;
}
