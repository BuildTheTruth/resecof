/**
 * RSC 클라이언트 - createFromFetch를 모방한 간단한 구현
 * 실제 React Server Components는 더 복잡하지만, 1주차 목표를 위한 최소 구현
 */

interface RSCPayload {
  type: string;
  data?: any;
  id?: string;
  clientComponents?: string[];
  error?: string;
}

/**
 * RSC 스트림을 가져와서 Promise로 변환
 * createFromFetch를 모방
 */
export async function fetchRSC(location: string): Promise<any> {
  const response = await fetch(
    `/react?location=${encodeURIComponent(location)}`
  );

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
          rootData = reviveRSCData(
            payload.data,
            payload.clientComponents || []
          );
        } else if (payload.type === "chunk" && payload.id) {
          // 비동기 청크 처리
          const revived = reviveRSCData(payload.data, []);
          const resolver = pendingChunks.get(payload.id);
          if (resolver) {
            resolver(revived);
            pendingChunks.delete(payload.id);
          }
        } else if (payload.type === "error") {
          console.error("RSC Error:", payload.error);
          throw new Error(payload.error || "Unknown RSC error");
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
      const element: any = {
        $$typeof: Symbol.for("react.element"),
        type: data.type,
        key: data.key,
        ref: null,
        props: {},
      };

      // 클라이언트 컴포넌트 처리
      if (data.type === "$ClientComponent") {
        const componentName = data.props?.$componentName;
        if (componentName) {
          // 동적으로 클라이언트 컴포넌트 로드
          element.type = loadClientComponent(componentName);
          element.props = reviveRSCData(
            Object.keys(data.props || {})
              .filter((k) => k !== "$componentName")
              .reduce((acc, k) => ({ ...acc, [k]: data.props[k] }), {}),
            clientComponents
          );
        }
      } else if (data.type === "$Suspense") {
        // Suspense placeholder
        element.props = { fallback: "Loading..." };
      } else {
        element.props = reviveRSCData(data.props, clientComponents);
      }

      return element;
    }

    // 일반 객체
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
