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
import {
  startHMRServer,
  notifyFileChange,
  notifyReload,
} from "../utils/hmr-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;
const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);
const isDev = process.env.NODE_ENV === "development";

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
// URL 인코딩된 폼 데이터 파싱 (점진적 향상 지원)
app.use(express.urlencoded({ extended: true }));

const publicDir = join(__dirname, "..", "public");
app.use("/dist/public", express.static(publicDir));
console.log(`📁 정적 파일 디렉토리: ${publicDir}`);

// 서버 액션 엔드포인트 (JSON 및 폼 제출 모두 지원)
app.post("/_actions", async (req, res) => {
  // 폼 제출인 경우 (application/x-www-form-urlencoded)
  if (req.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
    const formData = req.body;
    const actionId = formData.actionId || (req.query.actionId as string);
    const functionName = formData.functionName || (req.query.functionName as string);
    
    if (actionId && functionName) {
      // FormData를 JSON 형식으로 변환
      req.body = {
        actionId,
        functionName,
        args: Object.entries(formData)
          .filter(([key]) => key !== "actionId" && key !== "functionName")
          .map(([, value]) => value),
      };
    }
  }
  
  await handleServerAction(req, res);
});

// HMR 알림 엔드포인트 (개발 모드에서만)
if (isDev) {
  app.post("/_hmr/notify", (req, res) => {
    const { type, file } = req.body;
    if (type === "file-change" && file) {
      notifyFileChange(file);
    } else if (type === "reload") {
      notifyReload();
    }
    res.json({ success: true });
  });
}

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

  // 개발 모드에서 HMR 서버 시작
  if (isDev) {
    startHMRServer(WS_PORT);
  }
});
