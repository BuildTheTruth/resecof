import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createRouteHandler } from "../utils/route-handlers.js";
import { scanRoutes } from "../utils/route-scanner.js";
import {
  createFakeClientComponents,
  loadClientManifest,
} from "../utils/server-config.js";
import { handleServerAction } from "../utils/server-actions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;

const clientManifest = loadClientManifest();
createFakeClientComponents(["Counter", "LikeButton"]);

const pagesDir = join(__dirname, "..", "..", "dist", "pages");
const { staticRoutes, dynamicRoutes } = scanRoutes(pagesDir);
console.log(
  `📁 파일 기반 라우터: ${staticRoutes.size}개 정적 라우트, ${dynamicRoutes.size}개 동적 라우트 발견`
);

const app = express();

// JSON 파싱 미들웨어
app.use(express.json());

const publicDir = join(__dirname, "..", "public");
app.use("/dist/public", express.static(publicDir));
console.log(`📁 정적 파일 디렉토리: ${publicDir}`);

// 서버 액션 엔드포인트
app.post("/_actions", async (req, res) => {
  await handleServerAction(req, res);
});

const handleRoute = createRouteHandler(
  staticRoutes,
  dynamicRoutes,
  clientManifest
);

// 정적 라우트 등록
for (const route of staticRoutes.keys()) {
  app.get(route, handleRoute);
}

// 동적 라우트는 와일드카드로 처리 (정적 라우트보다 나중에 등록)
app.get("*", handleRoute);

app.listen(PORT, () => {
  console.log(`✨ 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(
    `📡 등록된 정적 라우트: ${Array.from(staticRoutes.keys()).join(", ")}`
  );
  if (dynamicRoutes.size > 0) {
    console.log(
      `📡 등록된 동적 라우트: ${Array.from(dynamicRoutes.values())
        .map((r) => r.pattern.toString())
        .join(", ")}`
    );
  }
});
