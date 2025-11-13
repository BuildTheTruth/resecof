import express from "express";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import {
  loadClientManifest,
  createFakeClientComponents,
} from "../utils/server-config.js";
import { scanRoutes } from "../utils/route-scanner.js";
import { createRouteHandler } from "../utils/route-handlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;

const clientManifest = loadClientManifest();
createFakeClientComponents(["Counter"]);

const pagesDir = join(__dirname, "..", "..", "dist", "pages");
const routes = scanRoutes(pagesDir);
console.log(`📁 파일 기반 라우터: ${routes.size}개 라우트 발견`);

const app = express();

const publicDir = join(__dirname, "..", "public");
app.use("/dist/public", express.static(publicDir));
console.log(`📁 정적 파일 디렉토리: ${publicDir}`);

const handleRoute = createRouteHandler(routes, clientManifest);

for (const route of routes.keys()) {
  app.get(route, handleRoute);
}

app.get("*", (req, res) => {
  res.status(404).send("404 Not Found");
});

app.listen(PORT, () => {
  console.log(`✨ 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`📡 등록된 라우트: ${Array.from(routes.keys()).join(", ")}`);
});
