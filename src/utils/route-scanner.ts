import { join } from "path";
import {
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import { rootDir } from "./server-config.js";

/**
 * 파일 기반 라우터: pages/ 디렉토리를 스캔하여 라우트 매핑 생성
 */

export type RouteMap = Map<string, () => Promise<any>>;

/**
 * 페이지 디렉토리를 스캔하여 라우트 매핑 생성
 */
export function scanRoutes(pagesDir: string): RouteMap {
  const routes = new Map<string, () => Promise<any>>();

  if (!existsSync(pagesDir)) {
    console.warn(`⚠️ pages 디렉토리가 없습니다: ${pagesDir}`);
    return routes;
  }

  function scanDirectory(dir: string, basePath: string = "") {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const routePath = basePath
        ? `${basePath}/${entry.name}`
        : `/${entry.name}`;

      if (entry.isDirectory()) {
        // 디렉토리인 경우 재귀적으로 스캔
        scanDirectory(fullPath, routePath);
      } else if (
        entry.name === "page.tsx" ||
        entry.name === "page.ts" ||
        entry.name === "page.js"
      ) {
        // page.tsx, page.ts, 또는 page.js 파일 발견
        // basePath가 /home이면 / 또는 /home으로 매핑
        const route = basePath === "/home" ? "/" : basePath;

        // 동적 import를 위한 경로 생성 (dist/pages/ 디렉토리 기준)
        // fullPath: /Users/.../resecof/dist/pages/home/page.js
        // 서버는 dist/server/에서 실행되므로 ../pages/로 접근
        const relativePath = fullPath.replace(pagesDir + "/", "");
        // 이미 .js 파일이므로 확장자 변경 불필요
        const importPath = `../pages/${relativePath}`;

        const routeLoader = async () => {
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
              console.warn(
                `⚠️ 클라이언트 컴포넌트 import 경고 (RSC 렌더러가 처리함): ${
                  error.message.split("\n")[0]
                }`
              );
              // 클라이언트 컴포넌트 import 에러는 이미 서버 시작 시 가짜 모듈이 생성되었으므로
              // import 경로에 쿼리 파라미터를 추가하여 모듈 캐시를 우회
              const componentName =
                error.message.match(/\/([^/]+)\.js/)?.[1] || "Component";

              console.warn(
                `⚠️ 클라이언트 컴포넌트 ${componentName} import 경고 (RSC 렌더러가 처리함)`
              );

              // import 경로에 쿼리 파라미터를 추가하여 모듈 캐시 우회
              // 가짜 모듈이 이미 생성되어 있으므로 이번에는 성공해야 함
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

                  // 다시 import 시도 (캐시 우회)
                  const module = await import(`${importPath}?t=${Date.now()}`);
                  return module.default;
                }
                throw retryError;
              }
            }
            console.error(
              `❌ 라우트 로드 실패: ${route} (${importPath})`,
              error
            );
            throw error;
          }
        };

        routes.set(route, routeLoader);

        // /home도 별도로 등록 (/, /home 둘 다 동작하도록)
        if (basePath === "/home") {
          routes.set("/home", routeLoader);
        }

        console.log(`✅ 라우트 등록: ${route} → ${importPath}`);
      }
    }
  }

  scanDirectory(pagesDir);
  return routes;
}
