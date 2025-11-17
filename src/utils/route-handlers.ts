import { Request, Response } from "express";
import { createElement } from "react";
import { join } from "path";
import { readFileSync } from "fs";
import { renderToRSCStream } from "./rsc-renderer.js";
import App from "../App.js";
import { rootDir } from "./server-config.js";
import { RouteMap, DynamicRouteMap, DynamicRoute } from "./route-scanner.js";

/**
 * 라우트 핸들러 함수들
 */

/**
 * 동적 라우트 매칭 및 파라미터 추출
 */
function matchDynamicRoute(
  path: string,
  dynamicRoutes: DynamicRouteMap
): { route: DynamicRoute; params: Record<string, string> } | null {
  for (const dynamicRoute of dynamicRoutes.values()) {
    const match = path.match(dynamicRoute.pattern);
    if (match) {
      const params: Record<string, string> = {};
      dynamicRoute.paramNames.forEach((paramName, index) => {
        params[paramName] = match[index + 1]; // match[0]은 전체 매칭, match[1]부터 캡처 그룹
      });
      return { route: dynamicRoute, params };
    }
  }
  return null;
}

/**
 * RSC 엔드포인트: 각 라우트에서 RSC 스트림 반환
 */
export async function handleRSCRequest(
  req: Request,
  res: Response,
  staticRoutes: RouteMap,
  dynamicRoutes: DynamicRouteMap,
  clientManifest: Record<string, string>
) {
  const location = req.path;

  console.log(`📡 RSC 요청: path=${location}`);

  try {
    // 1. 정적 라우트 먼저 확인
    let routeLoader = staticRoutes.get(location);
    let params: Record<string, string> | undefined = undefined;

    // 2. 정적 라우트가 없으면 동적 라우트 확인
    if (!routeLoader) {
      const dynamicMatch = matchDynamicRoute(location, dynamicRoutes);
      if (dynamicMatch) {
        routeLoader = dynamicMatch.route.loader;
        params = dynamicMatch.params;
        console.log(`  📌 동적 라우트 매칭: ${location} → params:`, params);
      }
    }

    if (!routeLoader) {
      res.status(404).json({
        type: "error",
        error: `Route not found: ${location}`,
      });
      return;
    }

    const PageComponent = await routeLoader();
    const root = createElement(App, { location, PageComponent, params });
    renderToRSCStream(root, res, clientManifest);
  } catch (error) {
    console.error("❌ 서버 에러:", error);
    res.status(500).json({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * HTML 페이지 반환
 */
export function sendHTMLPage(req: Request, res: Response) {
  const htmlPath = join(rootDir, "public", "index.html");
  const html = readFileSync(htmlPath, "utf-8");
  res.send(html);
}

/**
 * 라우트 핸들러: Accept 헤더로 HTML과 RSC 구분
 */
export function createRouteHandler(
  staticRoutes: RouteMap,
  dynamicRoutes: DynamicRouteMap,
  clientManifest: Record<string, string>
) {
  return (req: Request, res: Response) => {
    const accept = req.headers.accept || "";

    if (accept.includes("text/x-component")) {
      handleRSCRequest(req, res, staticRoutes, dynamicRoutes, clientManifest);
    } else {
      sendHTMLPage(req, res);
    }
  };
}
