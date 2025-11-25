/**
 * 개발 서버: HMR 지원
 * 파일 변경 감지 → 자동 빌드 → 클라이언트에 알림
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import chokidar from "chokidar";
import { existsSync } from "fs";
import http from "http";

// 환경 변수 설정
process.env.NODE_ENV = "development";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// 개발 서버 포트
const DEV_PORT = 3000;
const WS_PORT = 3001;

// 빌드 프로세스 관리
let buildProcess = null;
let serverProcess = null;
let wsServer = null;

/**
 * 빌드 실행
 */
async function runBuild() {
  return new Promise((resolve, reject) => {
    console.log("🔨 빌드 시작...");
    const buildScript = join(rootDir, "scripts", "build.mjs");
    buildProcess = spawn("node", [buildScript, "--dev"], {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "development",
        WS_PORT: WS_PORT.toString(),
      },
    });

    buildProcess.on("close", (code) => {
      buildProcess = null;
      if (code === 0) {
        console.log("✅ 빌드 완료");
        resolve();
      } else {
        console.error("❌ 빌드 실패");
        reject(new Error(`Build failed with code ${code}`));
      }
    });

    buildProcess.on("error", (error) => {
      buildProcess = null;
      console.error("❌ 빌드 프로세스 에러:", error);
      reject(error);
    });
  });
}

/**
 * 서버 시작
 */
function startServer() {
  return new Promise((resolve) => {
    const serverFile = join(rootDir, "dist", "server", "index.js");

    if (!existsSync(serverFile)) {
      console.error("❌ 서버 파일을 찾을 수 없습니다. 먼저 빌드하세요.");
      process.exit(1);
    }

    console.log("🚀 서버 시작 중...");
    serverProcess = spawn("node", [serverFile], {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "development",
        WS_PORT: WS_PORT.toString(),
      },
    });

    serverProcess.on("close", (code) => {
      serverProcess = null;
      if (code !== 0 && code !== null) {
        console.log(`서버 종료 (코드: ${code})`);
      }
    });

    serverProcess.on("error", (error) => {
      serverProcess = null;
      console.error("❌ 서버 프로세스 에러:", error);
    });

    // 서버가 시작될 때까지 대기
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

/**
 * 서버 재시작
 */
async function restartServer() {
  if (serverProcess) {
    console.log("🔄 서버 재시작 중...");
    serverProcess.kill();
    serverProcess = null;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  await startServer();
}

/**
 * WebSocket 서버 시작
 */
function startWebSocketServer() {
  // WebSocket 서버는 서버 코드에서 구현
  // 여기서는 클라이언트에 알림만 전송
  console.log(
    `📡 WebSocket 서버는 http://localhost:${WS_PORT} 에서 실행됩니다`
  );
}

/**
 * 파일 변경 감지 및 처리
 */
function watchFiles() {
  console.log("👀 파일 변경 감지 시작...");

  // 감시할 디렉토리
  const watchPaths = [
    join(rootDir, "src", "**", "*.ts"),
    join(rootDir, "src", "**", "*.tsx"),
    join(rootDir, "src", "**", "*.js"),
    join(rootDir, "src", "**", "*.jsx"),
  ];

  // 변경 감지 디바운스 (500ms)
  let buildTimeout = null;
  let lastChangedFile = null;

  const watcher = chokidar.watch(watchPaths, {
    ignored: /node_modules|dist/,
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("change", async (filePath) => {
    const relativePath = filePath.replace(rootDir + "/", "");
    console.log(`📝 파일 변경 감지: ${relativePath}`);

    lastChangedFile = relativePath;

    // 디바운스: 여러 파일이 동시에 변경되면 마지막 변경만 처리
    if (buildTimeout) {
      clearTimeout(buildTimeout);
    }

    buildTimeout = setTimeout(async () => {
      try {
        // 변경된 파일 타입에 따라 다른 처리
        if (relativePath.startsWith("src/server/")) {
          // 서버 파일 변경 → 서버만 재시작
          console.log("🔄 서버 파일 변경 감지 → 서버 재시작");
          await runBuild();
          await restartServer();
        } else if (relativePath.startsWith("src/pages/")) {
          // 페이지 파일 변경 → 전체 빌드 + 서버 재시작
          console.log("🔄 페이지 파일 변경 감지 → 전체 빌드 + 서버 재시작");
          await runBuild();
          await restartServer();
        } else if (relativePath.startsWith("src/components/")) {
          // 클라이언트 컴포넌트 변경 → 클라이언트 빌드 + HMR
          console.log(
            "🔄 클라이언트 컴포넌트 변경 감지 → 클라이언트 빌드 + HMR"
          );
          await runBuild();
          // 잠시 대기 후 클라이언트에 HMR 알림 (WebSocket으로 전송)
          // 서버가 재시작되었을 수 있으므로 충분한 대기 시간 필요
          setTimeout(async () => {
            await notifyClientHMR(relativePath);
          }, 2000);
        } else if (relativePath.startsWith("src/actions/")) {
          // 서버 액션 변경 → 서버 재시작
          console.log("🔄 서버 액션 변경 감지 → 서버 재시작");
          await runBuild();
          await restartServer();
        } else {
          // 기타 파일 변경 → 전체 빌드
          console.log("🔄 기타 파일 변경 감지 → 전체 빌드");
          await runBuild();
          await restartServer();
        }
      } catch (error) {
        console.error("❌ 빌드/재시작 실패:", error);
      }
    }, 500);
  });

  watcher.on("error", (error) => {
    console.error("❌ 파일 감지 에러:", error);
  });
}

/**
 * 클라이언트에 HMR 알림 전송
 * 서버의 HMR 엔드포인트를 통해 WebSocket으로 전송
 */
function notifyClientHMR(changedFile) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ type: "file-change", file: changedFile });

    const options = {
      hostname: "localhost",
      port: DEV_PORT,
      path: "/_hmr/notify",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`📤 HMR 알림 전송 완료: ${changedFile}`);
      } else {
        console.warn(`⚠️ HMR 알림 전송 실패: HTTP ${res.statusCode}`);
      }
      resolve();
    });

    req.on("error", (error) => {
      // 서버가 아직 시작되지 않았을 수 있음
      console.warn(`⚠️ HMR 알림 전송 실패: ${error.message}`);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 정리 함수
 */
function cleanup() {
  console.log("\n🛑 개발 서버 종료 중...");

  if (buildProcess) {
    buildProcess.kill();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
  if (wsServer) {
    wsServer.close();
  }

  process.exit(0);
}

// 프로세스 종료 시 정리
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

/**
 * 개발 서버 시작
 */
async function startDevServer() {
  console.log("🚀 개발 서버 시작...\n");

  try {
    // 초기 빌드
    await runBuild();

    // 서버 시작
    await startServer();

    // 파일 감지 시작
    watchFiles();

    console.log("\n✨ 개발 서버가 실행 중입니다!");
    console.log(`📡 서버: http://localhost:${DEV_PORT}`);
    console.log(`📡 WebSocket: ws://localhost:${WS_PORT}`);
    console.log("\n파일을 수정하면 자동으로 빌드되고 리로드됩니다.\n");
  } catch (error) {
    console.error("❌ 개발 서버 시작 실패:", error);
    process.exit(1);
  }
}

// 개발 서버 시작
startDevServer();
