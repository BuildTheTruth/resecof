/**
 * HMR WebSocket 서버
 * 개발 모드에서 클라이언트에 파일 변경 알림 전송
 */

import { WebSocketServer, WebSocket } from "ws";

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

/**
 * WebSocket 서버 시작
 */
export function startHMRServer(port: number) {
  if (wss) {
    console.log("⚠️ HMR 서버가 이미 실행 중입니다");
    return;
  }

  wss = new WebSocketServer({ port });

  wss.on("connection", (ws: WebSocket) => {
    console.log("🔌 HMR 클라이언트 연결");
    clients.add(ws);

    ws.on("close", () => {
      clients.delete(ws);
      console.log("🔌 HMR 클라이언트 연결 해제");
    });

    ws.on("error", (error: Error) => {
      console.error("❌ HMR WebSocket 에러:", error);
    });

    // 연결 확인 메시지 전송
    ws.send(JSON.stringify({ type: "connected" }));
  });

  console.log(
    `📡 HMR WebSocket 서버가 ws://localhost:${port} 에서 실행 중입니다`
  );
}

/**
 * WebSocket 서버 종료
 */
export function stopHMRServer() {
  if (wss) {
    wss.close();
    wss = null;
    clients.clear();
    console.log("🛑 HMR 서버 종료");
  }
}

/**
 * 클라이언트에 HMR 메시지 전송
 */
export function sendHMRMessage(type: string, data?: any) {
  if (!wss || clients.size === 0) {
    return;
  }

  const message = JSON.stringify({ type, data, timestamp: Date.now() });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  console.log(`📤 HMR 메시지 전송: ${type}`, data);
}

/**
 * 파일 변경 알림 전송
 */
export function notifyFileChange(filePath: string) {
  sendHMRMessage("file-change", { file: filePath });
}

/**
 * 전체 페이지 리로드 알림
 */
export function notifyReload() {
  sendHMRMessage("reload");
}
