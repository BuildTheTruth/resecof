import { Response } from "express";

/**
 * RSC 렌더러 - renderToPipeableStream을 모방한 간단한 구현
 * 실제 React Server Components는 더 복잡하지만, 1주차 목표를 위한 최소 구현
 */

interface RenderContext {
  id: number;
  tasks: Set<Promise<any>>;
  clientComponents: Set<string>;
  pipe: (data: any) => void;
  clientManifest?: Record<string, string>;
}

/**
 * React 요소를 RSC 페이로드로 변환
 */
function renderElement(element: any, context: RenderContext): any {
  if (element == null || typeof element === "boolean") {
    return null;
  }

  // 원시 타입
  if (typeof element === "string" || typeof element === "number") {
    return element;
  }

  // 배열
  if (Array.isArray(element)) {
    return element.map((item) => renderElement(item, context));
  }

  // React Element
  if (element.$$typeof === Symbol.for("react.element")) {
    const { type, props, key } = element;

    // HTML 태그
    if (typeof type === "string") {
      return {
        $$typeof: Symbol.for("react.element"),
        type,
        key,
        props: renderProps(props, context),
      };
    }

    // 함수 컴포넌트
    if (typeof type === "function") {
      const componentName = type.name || "Anonymous";

      // 클라이언트 컴포넌트 감지 (파일명에 .client가 있거나, 함수에 마킹된 경우)
      if (isClientComponent(type)) {
        context.clientComponents.add(componentName);

        // 매니페스트에서 클라이언트 컴포넌트 URL 찾기
        let componentUrl: string | undefined;
        if (context.clientManifest) {
          // 컴포넌트 이름으로 먼저 찾기
          componentUrl = context.clientManifest[componentName];
          // 없으면 모듈 경로로 찾기 (type이 함수인 경우 파일 경로 정보가 없을 수 있음)
          if (!componentUrl) {
            // Counter 같은 경우 직접 매핑 시도
            const modulePath = `shared/${componentName}.client.tsx`;
            componentUrl = context.clientManifest[modulePath] || context.clientManifest[`shared/${componentName}.client`];
          }
        }

        return {
          $$typeof: Symbol.for("react.element"),
          type: "$ClientComponent",
          key,
          props: {
            ...renderProps(props, context),
            $componentName: componentName,
            $componentUrl: componentUrl, // 매니페스트에서 찾은 URL 전달
          },
        };
      }

      // 서버 컴포넌트 실행
      try {
        const rendered = type(props);

        // Promise 처리 (비동기 컴포넌트)
        if (rendered && typeof rendered.then === "function") {
          const id = `C:${context.id++}`;
          context.tasks.add(rendered);

          rendered
            .then((result: any) => {
              context.tasks.delete(rendered);
              context.pipe({
                id,
                type: "chunk",
                data: renderElement(result, context),
              });
            })
            .catch((error: Error) => {
              context.tasks.delete(rendered);
              context.pipe({
                id,
                type: "error",
                error: error.message,
              });
            });

          return {
            $$typeof: Symbol.for("react.element"),
            type: "$Suspense",
            key,
            props: { id },
          };
        }

        return renderElement(rendered, context);
      } catch (error) {
        console.error("Error rendering component:", error);
        return null;
      }
    }
  }

  // 객체
  if (typeof element === "object") {
    const result: any = {};
    for (const key in element) {
      result[key] = renderElement(element[key], context);
    }
    return result;
  }

  return element;
}

/**
 * Props 렌더링
 */
function renderProps(props: any, context: RenderContext): any {
  if (!props) return {};

  const result: any = {};
  for (const key in props) {
    if (key === "children") {
      result.children = renderElement(props.children, context);
    } else if (typeof props[key] === "function") {
      // 함수는 클라이언트로 전송 불가 - 무시하거나 에러
      // 실제 RSC에서는 서버 액션으로 변환
      continue;
    } else {
      result[key] = renderElement(props[key], context);
    }
  }
  return result;
}

/**
 * 클라이언트 컴포넌트 감지
 */
function isClientComponent(component: any): boolean {
  // 'use client' 마킹이 있는지 확인
  // 실제로는 번들러가 이를 처리하지만, 여기서는 간단하게 구현
  const name = component.name || "";
  return (
    component.__isClientComponent === true ||
    name.toLowerCase().includes("client") ||
    name === "Counter" || // 명시적으로 Counter를 클라이언트 컴포넌트로 지정
    false
  );
}

/**
 * 데이터를 직렬화
 */
function serialize(data: any): string {
  return JSON.stringify(data, (key, value) => {
    // Symbol 처리
    if (typeof value === "symbol") {
      return value.toString();
    }
    return value;
  });
}

/**
 * RSC 스트림 렌더링 (renderToPipeableStream 모방)
 */
export function renderToRSCStream(
  element: any,
  res: Response,
  clientManifest?: Record<string, string>
) {
  const context: RenderContext = {
    id: 0,
    tasks: new Set(),
    clientComponents: new Set(),
    clientManifest,
    pipe: (data: any) => {
      res.write(serialize(data) + "\n");

      // 모든 작업이 완료되면 스트림 종료
      if (context.tasks.size === 0) {
        res.end();
      }
    },
  };

  // Content-Type 설정
  res.setHeader("Content-Type", "text/x-component; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    // 초기 렌더링
    const rendered = renderElement(element, context);

    // 클라이언트 컴포넌트 정보와 매니페스트 URL 매핑 로깅
    const clientComponentInfo: Record<string, string> = {};
    if (context.clientManifest) {
      for (const componentName of context.clientComponents) {
        const url = context.clientManifest[componentName] || 
                   context.clientManifest[`shared/${componentName}.client.tsx`] ||
                   context.clientManifest[`shared/${componentName}.client`];
        if (url) {
          clientComponentInfo[componentName] = url;
          console.log(`  📦 클라이언트 컴포넌트 매핑: ${componentName} → ${url}`);
        }
      }
    }

    context.pipe({
      type: "root",
      data: rendered,
      clientComponents: Array.from(context.clientComponents),
      clientManifest: clientComponentInfo, // 매니페스트 정보도 함께 전달
    });
  } catch (error) {
    console.error("RSC Render Error:", error);
    res.status(500);
    context.pipe({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * 클라이언트 컴포넌트 마킹 헬퍼
 */
export function markAsClientComponent(component: any) {
  component.__isClientComponent = true;
  return component;
}
