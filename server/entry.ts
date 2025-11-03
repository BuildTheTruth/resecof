import express from "express";
import { createElement } from "react";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { renderToRSCStream } from "./rsc-renderer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// 정적 파일 서빙
// 서버가 dist/server/에서 실행되므로, 프로젝트 루트의 public 디렉토리를 찾기 위해 두 단계 위로 이동
const publicDir = join(__dirname, "..", "..", "public");
app.use(express.static(publicDir));
console.log(`📁 정적 파일 디렉토리: ${publicDir}`);

// RSC 엔드포인트: 각 라우트에서 RSC 스트림 반환
async function handleRSCRequest(req: express.Request, res: express.Response) {
  const location = req.path; // /, /about, /home 등

  console.log(`📡 RSC 요청: path=${location}`);

  try {
    // 동적으로 App 컴포넌트 import
    const { default: App } = await import("../shared/App.server.js");

    // App 컴포넌트를 location prop과 함께 렌더링
    const root = createElement(App, { location });

    // RSC 스트림으로 렌더링 (renderToPipeableStream 모방)
    renderToRSCStream(root, res);
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
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Server Components - Week 1</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: #f5f5f5;
        padding: 20px;
      }
      #root {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      h1 {
        margin-bottom: 20px;
        color: #333;
      }
      .loading {
        color: #666;
        font-style: italic;
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="loading">로딩 중...</div>
    </div>
    <script type="module" src="/client.js"></script>
  </body>
</html>
  `;
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

// RSC 라우트 정의 (HTML 서빙 전에 위치)
app.get("/", handleRoute);
app.get("/about", handleRoute);
app.get("/home", handleRoute);

// 나머지 모든 라우트는 404
app.get("*", (req, res) => {
  res.status(404).send("404 Not Found");
});

app.listen(PORT, () => {
  console.log(`✨ 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`📡 RSC 라우트: /, /about, /home`);
});
