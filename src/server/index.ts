import express from "express";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import {
  loadClientManifest,
  createFakeClientComponents,
  loadClientComponent,
} from "../utils/server-config.js";
import { scanRoutes } from "../utils/route-scanner.js";
import { createRouteHandler } from "../utils/route-handlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 서버 설정
const PORT = 3000;

// 클라이언트 컴포넌트 로더 전역 등록
(global as any).__loadClientComponent = loadClientComponent;

// 클라이언트 매니페스트 로드
const clientManifest = loadClientManifest();

// 서버 시작 시 필요한 클라이언트 컴포넌트 가짜 모듈 미리 생성
createFakeClientComponents(["Counter"]);

// 라우트 매핑 생성
const pagesDir = join(__dirname, "..", "..", "dist", "pages");
const routes = scanRoutes(pagesDir);
console.log(`📁 파일 기반 라우터: ${routes.size}개 라우트 발견`);

// Express 앱 생성
const app = express();

// 정적 파일 서빙
const publicDir = join(__dirname, "..", "public");
app.use("/dist/public", express.static(publicDir));
console.log(`📁 정적 파일 디렉토리: ${publicDir}`);

// 라우트 핸들러 생성
const handleRoute = createRouteHandler(routes, clientManifest);

// 동적으로 라우트 등록 (파일 기반 라우터에서 발견한 모든 라우트)
for (const route of routes.keys()) {
  app.get(route, handleRoute);
}

// 나머지 모든 라우트는 404
app.get("*", (req, res) => {
  res.status(404).send("404 Not Found");
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✨ 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`📡 등록된 라우트: ${Array.from(routes.keys()).join(", ")}`);
});
