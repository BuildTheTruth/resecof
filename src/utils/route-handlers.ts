import { Request, Response } from "express";
import { createElement } from "react";
import { join } from "path";
import { readFileSync } from "fs";
import { renderToRSCStream } from "./rsc-renderer.js";
import App from "../App.js";
import { rootDir } from "./server-config.js";
import { RouteMap } from "./route-scanner.js";

/**
 * 라우트 핸들러 함수들
 */

/**
 * RSC 엔드포인트: 각 라우트에서 RSC 스트림 반환
 */
export async function handleRSCRequest(
  req: Request,
  res: Response,
  routes: RouteMap,
  clientManifest: Record<string, string>
) {
  const location = req.path;

  console.log(`📡 RSC 요청: path=${location}`);

  try {
    const routeLoader = routes.get(location);

    if (!routeLoader) {
      res.status(404).json({
        type: "error",
        error: `Route not found: ${location}`,
      });
      return;
    }

    const PageComponent = await routeLoader();
    const root = createElement(App, { location, PageComponent });
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
  routes: RouteMap,
  clientManifest: Record<string, string>
) {
  return (req: Request, res: Response) => {
    const accept = req.headers.accept || "";

    if (accept.includes("text/x-component")) {
      handleRSCRequest(req, res, routes, clientManifest);
    } else {
      sendHTMLPage(req, res);
    }
  };
}
