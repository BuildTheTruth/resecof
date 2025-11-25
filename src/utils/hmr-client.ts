/**
 * 클라이언트 HMR 로직
 * WebSocket으로 서버와 연결하여 파일 변경 알림을 받고 핫 리로드 처리
 */

// 개발 모드 감지 (빌드 시 주입)
declare const __DEV__: boolean;
declare const __WS_PORT__: number;

const WS_URL = `ws://localhost:${
  typeof __WS_PORT__ !== "undefined" ? __WS_PORT__ : 3001
}`;
const isDev =
  typeof __DEV__ !== "undefined"
    ? __DEV__
    : window.location.hostname === "localhost";

let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

/**
 * WebSocket 연결
 */
function connect() {
  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("✅ HMR 연결 성공");
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleHMRMessage(message);
      } catch (error) {
        console.error("❌ HMR 메시지 파싱 실패:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ HMR WebSocket 에러:", error);
    };

    ws.onclose = () => {
      console.log("🔌 HMR 연결 종료");
      ws = null;

      // 개발 모드에서만 재연결 시도
      if (isDev) {
        reconnectTimeout = setTimeout(() => {
          console.log("🔄 HMR 재연결 시도...");
          connect();
        }, 3000);
      }
    };
  } catch (error) {
    console.error("❌ HMR 연결 실패:", error);
  }
}

/**
 * HMR 메시지 처리
 */
function handleHMRMessage(message: { type: string; data?: any }) {
  console.log("📥 HMR 메시지 수신:", message.type, message.data);

  switch (message.type) {
    case "connected":
      console.log("✅ HMR 서버 연결 확인");
      break;

    case "file-change":
      handleFileChange(message.data?.file);
      break;

    case "reload":
      handleReload();
      break;

    default:
      console.warn("⚠️ 알 수 없는 HMR 메시지 타입:", message.type);
  }
}

/**
 * 파일 변경 처리
 */
function handleFileChange(filePath: string) {
  console.log(`🔄 파일 변경 감지: ${filePath}`);

  // 클라이언트 컴포넌트 변경인 경우
  if (filePath.includes("components/")) {
    const componentName = filePath
      .split("/")
      .pop()
      ?.replace(/\.(tsx?|jsx?)$/, "");

    if (componentName) {
      // 클라이언트 컴포넌트 핫 리로드
      hotReloadComponent(componentName);
    } else {
      // 전체 페이지 리로드
      handleReload();
    }
  } else if (filePath.includes("pages/")) {
    // 페이지 변경인 경우 전체 페이지 리로드
    handleReload();
  } else {
    // 기타 파일 변경은 전체 페이지 리로드
    handleReload();
  }
}

/**
 * 컴포넌트 핫 리로드
 */
function hotReloadComponent(componentName: string) {
  console.log(`🔥 컴포넌트 핫 리로드: ${componentName}`);

  // 전역 레지스트리에서 컴포넌트 제거
  if ((window as any).__CLIENT_COMPONENTS__) {
    delete (window as any).__CLIENT_COMPONENTS__[componentName];
  }

  // 새로운 번들을 로드하여 컴포넌트 업데이트
  // 실제 구현에서는 동적 import를 사용하거나
  // 전체 페이지 리로드로 대체할 수 있습니다
  const timestamp = Date.now();
  const script = document.createElement("script");
  script.src = `/dist/public/main.js?t=${timestamp}`;
  script.onload = () => {
    console.log(`✅ 컴포넌트 리로드 완료: ${componentName}`);
    // React 컴포넌트 트리 업데이트를 위해 페이지 리로드
    // 실제로는 React Fast Refresh 같은 메커니즘을 사용해야 함
    window.location.reload();
  };
  script.onerror = () => {
    console.error(`❌ 컴포넌트 리로드 실패: ${componentName}`);
    handleReload();
  };
  document.head.appendChild(script);
}

/**
 * 전체 페이지 리로드
 */
function handleReload() {
  console.log("🔄 전체 페이지 리로드");
  window.location.reload();
}

/**
 * HMR 클라이언트 초기화
 */
export function initHMR() {
  // 개발 모드에서만 HMR 활성화
  if (!isDev) {
    return;
  }

  // WebSocket이 지원되는지 확인
  if (typeof WebSocket === "undefined") {
    console.warn("⚠️ WebSocket을 지원하지 않는 브라우저입니다");
    return;
  }

  console.log("🚀 HMR 클라이언트 초기화");
  connect();
}

/**
 * HMR 클라이언트 종료
 */
export function cleanupHMR() {
  if (ws) {
    ws.close();
    ws = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}
