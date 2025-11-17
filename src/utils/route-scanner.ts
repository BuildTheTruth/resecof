import { join } from "path";
import { readdirSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { rootDir } from "./server-config.js";

/**
 * 파일 기반 라우터: pages/ 디렉토리를 스캔하여 라우트 매핑 생성
 */

export type RouteLoader = () => Promise<any>;
export type RouteMap = Map<string, RouteLoader>;

// 동적 라우트 정보
export interface DynamicRoute {
  pattern: RegExp; // 매칭 패턴 (예: /^\/blogs\/([^/]+)$/)
  paramNames: string[]; // 파라미터 이름 (예: ['id'])
  loader: RouteLoader; // 라우트 로더
  filePath: string; // 원본 파일 경로
}

export type DynamicRouteMap = Map<string, DynamicRoute>; // 키는 원본 파일 경로

/**
 * 파일명에서 동적 파라미터 추출
 * 예: [id].tsx -> { paramName: 'id', pattern: '[^/]+' }
 */
function extractDynamicParam(
  fileName: string
): { paramName: string; pattern: string } | null {
  const match = fileName.match(/^\[([^\]]+)\]\.(tsx?|jsx?)$/);
  if (match) {
    return { paramName: match[1], pattern: "[^/]+" };
  }
  return null;
}

/**
 * 경로에서 동적 라우트 패턴 생성
 * 예: /blogs/[id] -> { pattern: /^\/blogs\/([^/]+)$/, paramNames: ['id'] }
 */
function createDynamicRoutePattern(
  basePath: string,
  paramName: string
): { pattern: RegExp; paramNames: string[] } {
  // basePath가 /blogs이고 paramName이 id면 /blogs/:id 패턴 생성
  const routePattern = basePath.replace(/\/$/, "") + "/([^/]+)";
  const regex = new RegExp(`^${routePattern}$`);
  return { pattern: regex, paramNames: [paramName] };
}

/**
 * 페이지 디렉토리를 스캔하여 라우트 매핑 생성
 */
export function scanRoutes(pagesDir: string): {
  staticRoutes: RouteMap;
  dynamicRoutes: DynamicRouteMap;
} {
  const staticRoutes = new Map<string, RouteLoader>();
  const dynamicRoutes = new Map<string, DynamicRoute>();

  if (!existsSync(pagesDir)) {
    console.warn(`⚠️ pages 디렉토리가 없습니다: ${pagesDir}`);
    return { staticRoutes, dynamicRoutes };
  }

  function scanDirectory(dir: string, basePath: string = "") {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // 디렉토리인 경우 재귀적으로 스캔
        const routePath = basePath
          ? `${basePath}/${entry.name}`
          : `/${entry.name}`;
        scanDirectory(fullPath, routePath);
      } else {
        // 동적 파라미터 파일인지 확인 (예: [id].tsx)
        const dynamicParam = extractDynamicParam(entry.name);

        if (dynamicParam) {
          // 동적 라우트 처리
          const relativePath = fullPath.replace(pagesDir + "/", "");
          const importPath = `../pages/${relativePath}`;

          const { pattern, paramNames } = createDynamicRoutePattern(
            basePath,
            dynamicParam.paramName
          );

          const routeLoader = createRouteLoader(importPath);

          const dynamicRoute: DynamicRoute = {
            pattern,
            paramNames,
            loader: routeLoader,
            filePath: fullPath,
          };

          // 파일 경로를 키로 사용하여 동적 라우트 저장
          dynamicRoutes.set(fullPath, dynamicRoute);
          console.log(
            `✅ 동적 라우트 등록: ${basePath}/[${dynamicParam.paramName}] → ${importPath}`
          );
        } else if (
          entry.name === "page.tsx" ||
          entry.name === "page.ts" ||
          entry.name === "page.js"
        ) {
          // 정적 라우트 처리
          const route = basePath === "/home" ? "/" : basePath;

          // 동적 import를 위한 경로 생성
          const relativePath = fullPath.replace(pagesDir + "/", "");
          const importPath = `../pages/${relativePath}`;

          const routeLoader = createRouteLoader(importPath);

          staticRoutes.set(route, routeLoader);

          // /home도 별도로 등록 (/, /home 둘 다 동작하도록)
          if (basePath === "/home") {
            staticRoutes.set("/home", routeLoader);
          }

          console.log(`✅ 정적 라우트 등록: ${route} → ${importPath}`);
        }
      }
    }
  }

  // 라우트 로더 생성 헬퍼 함수
  function createRouteLoader(importPath: string): RouteLoader {
    return async () => {
      try {
        const module = await import(importPath);
        return module.default;
      } catch (error: any) {
        // 클라이언트 컴포넌트 import 에러인 경우
        // RSC 렌더러가 클라이언트 컴포넌트를 감지하므로 이 에러는 무시 가능
        if (
          error?.code === "ERR_MODULE_NOT_FOUND" &&
          error?.message?.includes("components")
        ) {
          // 클라이언트 컴포넌트 import 에러는 이미 서버 시작 시 가짜 모듈이 생성되었으므로
          // import 경로에 쿼리 파라미터를 추가하여 모듈 캐시를 우회
          const componentName =
            error.message.match(/\/([^/]+)\.js/)?.[1] || "Component";

          console.warn(
            `⚠️ 클라이언트 컴포넌트 ${componentName} import 경고 (RSC 렌더러가 처리함)`
          );

          // import 경로에 쿼리 파라미터를 추가하여 모듈 캐시 우회
          const cacheBustPath = `${importPath}?t=${Date.now()}`;
          try {
            const module = await import(cacheBustPath);
            return module.default;
          } catch (retryError: any) {
            // 여전히 같은 에러인 경우, 가짜 모듈이 생성되지 않았을 수 있음
            if (
              retryError?.code === "ERR_MODULE_NOT_FOUND" &&
              retryError?.message?.includes("components")
            ) {
              // 가짜 모듈 생성 후 다시 시도
              const componentsDir = join(rootDir, "dist", "components");
              const fakeComponentPath = join(
                componentsDir,
                `${componentName}.js`
              );

              if (!existsSync(componentsDir)) {
                mkdirSync(componentsDir, { recursive: true });
              }
              writeFileSync(
                fakeComponentPath,
                `export default function ${componentName}() { return null; }`,
                "utf-8"
              );

              const module = await import(`${importPath}?t=${Date.now()}`);
              return module.default;
            }
            throw retryError;
          }
        }
        console.error(`❌ 라우트 로드 실패: ${importPath}`, error);
        throw error;
      }
    };
  }

  scanDirectory(pagesDir);
  return { staticRoutes, dynamicRoutes };
}
