import express from "express";
import { createElement } from "react";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import { renderToRSCStream } from "../utils/rsc-renderer.js";
import App from "../App.js"; // App은 서버 컴포넌트

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 서버는 dist/server/에서 실행되므로, 프로젝트 루트는 ../.. (dist/server -> dist -> 프로젝트 루트)
const rootDir = join(__dirname, "..", "..");

// 클라이언트 컴포넌트를 동적으로 로드하는 헬퍼 함수
// 서버에서 실행 시 클라이언트 컴포넌트는 실행되지 않으므로 빈 컴포넌트 반환
// RSC 렌더러가 클라이언트 컴포넌트를 감지하므로 실제로는 사용되지 않음
async function loadClientComponent(componentName: string) {
  try {
    // 클라이언트 컴포넌트 경로 (서버에서는 존재하지 않지만, import 에러를 방지하기 위해 시도)
    const componentPath = join(
      rootDir,
      "dist",
      "components",
      `${componentName}.js`
    );
    if (existsSync(componentPath)) {
      const module = await import(componentPath);
      return module.default;
    }
  } catch (error) {
    // 클라이언트 컴포넌트는 서버에서 실행되지 않으므로 에러 무시
  }
  // 가짜 컴포넌트 반환 (RSC 렌더러가 실제 클라이언트 컴포넌트를 처리함)
  return function FakeComponent() {
    return null;
  };
}

// 전역으로 클라이언트 컴포넌트 로더를 등록 (페이지 컴포넌트에서 사용 가능하도록)
(global as any).__loadClientComponent = loadClientComponent;

// 클라이언트 매니페스트 로드
let clientManifest: Record<string, string> = {};
try {
  const manifestPath = join(rootDir, "dist", "react-client-manifest.json");
  const manifestContent = readFileSync(manifestPath, "utf-8");
  clientManifest = JSON.parse(manifestContent);
  console.log(
    "📋 클라이언트 매니페스트 로드 완료:",
    Object.keys(clientManifest).length,
    "개 모듈"
  );
} catch (error) {
  console.warn("⚠️ 클라이언트 매니페스트를 로드할 수 없습니다:", error);
}

// 파일 기반 라우터: pages/ 디렉토리를 스캔하여 라우트 매핑 생성
type RouteMap = Map<string, () => Promise<any>>;

function scanRoutes(pagesDir: string): RouteMap {
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

// 라우트 매핑 생성 (dist/pages/ 디렉토리 스캔)
// 서버는 dist/server/에서 실행되므로 dist/pages/를 스캔
// rootDir은 프로젝트 루트이므로 dist/pages/ 경로 사용
const pagesDir = join(rootDir, "dist", "pages");

// 서버 시작 시 필요한 클라이언트 컴포넌트 가짜 모듈 미리 생성
// 페이지 컴포넌트에서 사용하는 클라이언트 컴포넌트를 찾아서 생성
const componentsDir = join(rootDir, "dist", "components");
if (!existsSync(componentsDir)) {
  mkdirSync(componentsDir, { recursive: true });
}

// 일반적으로 사용되는 클라이언트 컴포넌트 목록 (필요시 확장 가능)
const commonClientComponents = ["Counter"];
for (const componentName of commonClientComponents) {
  const fakeComponentPath = join(componentsDir, `${componentName}.js`);
  if (!existsSync(fakeComponentPath)) {
    writeFileSync(
      fakeComponentPath,
      `export default function ${componentName}() { return null; }`,
      "utf-8"
    );
    console.log(`✅ 클라이언트 컴포넌트 가짜 모듈 생성: ${componentName}`);
  }
}

const routes = scanRoutes(pagesDir);
console.log(`📁 파일 기반 라우터: ${routes.size}개 라우트 발견`);

const app = express();
const PORT = 3000;

// 정적 파일 서빙
// 서버가 dist/server/에서 실행되므로, dist/public 디렉토리를 찾기 위해 한 단계 위로 이동
const publicDir = join(__dirname, "..", "public");
app.use("/dist/public", express.static(publicDir));
console.log(`📁 정적 파일 디렉토리: ${publicDir}`);

// RSC 엔드포인트: 각 라우트에서 RSC 스트림 반환
async function handleRSCRequest(req: express.Request, res: express.Response) {
  const location = req.path; // /, /about, /home 등

  console.log(`📡 RSC 요청: path=${location}`);

  try {
    // 파일 기반 라우터에서 페이지 컴포넌트 로드
    const routeLoader = routes.get(location);

    if (!routeLoader) {
      res.status(404).json({
        type: "error",
        error: `Route not found: ${location}`,
      });
      return;
    }

    // 동적으로 페이지 컴포넌트 로드
    const PageComponent = await routeLoader();

    // App 컴포넌트를 location과 PageComponent prop과 함께 렌더링
    const root = createElement(App, { location, PageComponent });

    // RSC 스트림으로 렌더링 (renderToPipeableStream 모방)
    renderToRSCStream(root, res, clientManifest);
  } catch (error) {
    console.error("❌ 서버 에러:", error);
    res.status(500).json({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// HTML 페이지 반환
function sendHTMLPage(req: express.Request, res: express.Response) {
  // public/index.html은 프로젝트 루트의 public/ 디렉토리에 있음
  const htmlPath = join(rootDir, "public", "index.html");
  const html = readFileSync(htmlPath, "utf-8");
  res.send(html);
}

// 라우트 핸들러: Accept 헤더로 HTML과 RSC 구분
function handleRoute(req: express.Request, res: express.Response) {
  const accept = req.headers.accept || "";

  // RSC 요청 (text/x-component를 명시적으로 요청)
  if (accept.includes("text/x-component")) {
    handleRSCRequest(req, res);
  } else {
    // 브라우저가 직접 접속 (text/html을 요청하거나 Accept 헤더 없음)
    sendHTMLPage(req, res);
  }
}

// 동적으로 라우트 등록 (파일 기반 라우터에서 발견한 모든 라우트)
for (const route of routes.keys()) {
  app.get(route, handleRoute);
}

// 나머지 모든 라우트는 404
app.get("*", (req, res) => {
  res.status(404).send("404 Not Found");
});

app.listen(PORT, () => {
  console.log(`✨ 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`📡 등록된 라우트: ${Array.from(routes.keys()).join(", ")}`);
});
