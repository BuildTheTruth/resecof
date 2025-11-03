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
app.use(express.static(join(__dirname, "..", "public")));

// RSC 엔드포인트: /react?location=...
app.get("/react", async (req, res) => {
  const location = (req.query.location as string) || "/";

  console.log(`📡 RSC 요청: location=${location}`);

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
});

// 기본 HTML 페이지
app.get("*", (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`✨ 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`📡 RSC 엔드포인트: http://localhost:${PORT}/react`);
});
