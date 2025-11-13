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

/**
 * HTML 페이지 반환
 */
export function sendHTMLPage(req: Request, res: Response) {
  // public/index.html은 프로젝트 루트의 public/ 디렉토리에 있음
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

    // RSC 요청 (text/x-component를 명시적으로 요청)
    if (accept.includes("text/x-component")) {
      handleRSCRequest(req, res, routes, clientManifest);
    } else {
      // 브라우저가 직접 접속 (text/html을 요청하거나 Accept 헤더 없음)
      sendHTMLPage(req, res);
    }
  };
}
