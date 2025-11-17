import { Response } from "express";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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

      // ClientComponent 래퍼 감지 (서버에서 클라이언트 컴포넌트를 래핑한 경우)
      if (componentName === "ClientComponent" && props?.componentName) {
        const wrappedComponentName = props.componentName;
        context.clientComponents.add(wrappedComponentName);

        // 매니페스트에서 클라이언트 컴포넌트 URL 찾기
        let componentUrl: string | undefined;
        if (context.clientManifest) {
          componentUrl = context.clientManifest[wrappedComponentName];
          if (!componentUrl) {
            const modulePath = `src/components/${wrappedComponentName}.tsx`;
            componentUrl =
              context.clientManifest[modulePath] ||
              context.clientManifest[
                `src/components/${wrappedComponentName}.ts`
              ] ||
              context.clientManifest[
                `src/components/${wrappedComponentName}`
              ] ||
              context.clientManifest[
                `components/${wrappedComponentName}.tsx`
              ] ||
              context.clientManifest[`components/${wrappedComponentName}.ts`] ||
              context.clientManifest[`components/${wrappedComponentName}`];
          }
        }

        // componentName prop을 제외한 나머지 props 전달
        const { componentName: _, ...restProps } = props;

        return {
          $$typeof: Symbol.for("react.element"),
          type: "$ClientComponent",
          key,
          props: {
            ...renderProps(restProps, context),
            $componentName: wrappedComponentName,
            $componentUrl: componentUrl,
          },
        };
      }

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
            // src/components/ 경로 우선 시도
            const clientPath = `src/components/${componentName}.tsx`;
            componentUrl =
              context.clientManifest[clientPath] ||
              context.clientManifest[`src/components/${componentName}.ts`] ||
              context.clientManifest[`src/components/${componentName}`] ||
              context.clientManifest[`components/${componentName}.tsx`] ||
              context.clientManifest[`components/${componentName}.ts`] ||
              context.clientManifest[`components/${componentName}`];
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

// 'use client' 지시어 확인 결과 캐시
const useClientCache = new Map<string, boolean>();

/**
 * 파일에서 'use client' 지시어 확인
 */
function hasUseClientDirective(filePath: string): boolean {
  // 캐시 확인
  if (useClientCache.has(filePath)) {
    return useClientCache.get(filePath)!;
  }

  try {
    if (!existsSync(filePath)) {
      useClientCache.set(filePath, false);
      return false;
    }

    const content = readFileSync(filePath, "utf-8");
    // 파일 시작 부분에서 'use client' 확인 (주석 제거 전에 확인)
    const trimmed = content.trim();
    const hasDirective =
      trimmed.startsWith('"use client"') ||
      trimmed.startsWith("'use client'") ||
      trimmed.startsWith("`use client`") ||
      /^["'`]use client["'`]/.test(trimmed);

    useClientCache.set(filePath, hasDirective);
    return hasDirective;
  } catch (error) {
    useClientCache.set(filePath, false);
    return false;
  }
}

/**
 * 컴포넌트 함수의 원본 파일 경로 찾기
 */
function findComponentFilePath(component: any): string | null {
  // __isClientComponent가 이미 설정되어 있으면 파일 경로를 찾을 필요 없음
  // 하지만 'use client' 확인을 위해 경로를 찾아야 함

  // 1. require.cache에서 찾기 (CommonJS 모듈)
  if (typeof require !== "undefined" && require.cache) {
    for (const modulePath in require.cache) {
      const module = require.cache[modulePath];
      if (module && module.exports) {
        // default export 확인
        if (
          module.exports.default === component ||
          module.exports === component
        ) {
          return modulePath;
        }
        // named export 확인
        for (const key in module.exports) {
          if (module.exports[key] === component) {
            return modulePath;
          }
        }
      }
    }
  }

  // 2. 컴포넌트 이름으로 추론 (src/components/ 경로 우선)
  const componentName = component.name;
  if (componentName) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = join(__dirname, "..", "..");

    // 소스 파일 경로 우선 시도 (TypeScript/JSX 파일)
    const possiblePaths = [
      join(projectRoot, "src", "components", `${componentName}.tsx`),
      join(projectRoot, "src", "components", `${componentName}.ts`),
      join(projectRoot, "src", "components", `${componentName}.jsx`),
      join(projectRoot, "src", "components", `${componentName}.js`),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }
  }

  return null;
}

/**
 * 클라이언트 컴포넌트 감지
 */
function isClientComponent(component: any): boolean {
  // 1. 기존 __isClientComponent 마킹 확인 (하위 호환성)
  if (component.__isClientComponent === true) {
    return true;
  }

  // 2. 파일에서 'use client' 지시어 확인
  const filePath = findComponentFilePath(component);
  if (filePath) {
    // 컴파일된 파일인 경우 소스 파일 경로로 변환 시도
    let sourcePath = filePath;
    if (filePath.includes("dist")) {
      sourcePath = filePath
        .replace(/dist[\/\\]shared[\/\\]/, "src/")
        .replace(/dist[\/\\]components[\/\\]/, "src/components/")
        .replace(/\.js$/, ".tsx")
        .replace(/\.jsx$/, ".tsx");
    }

    // 소스 파일과 컴파일된 파일 모두 확인
    if (hasUseClientDirective(sourcePath) || hasUseClientDirective(filePath)) {
      return true;
    }
  }

  return false;
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
        const url =
          context.clientManifest[componentName] ||
          context.clientManifest[`client/components/${componentName}.tsx`] ||
          context.clientManifest[`client/components/${componentName}.ts`] ||
          context.clientManifest[`client/components/${componentName}`];
        if (url) {
          clientComponentInfo[componentName] = url;
          console.log(
            `  📦 클라이언트 컴포넌트 매핑: ${componentName} → ${url}`
          );
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
