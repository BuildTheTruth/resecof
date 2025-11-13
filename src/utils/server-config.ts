import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";

/**
 * 서버 설정 및 유틸리티 함수
 */

/**
 * 프로젝트 루트 디렉토리 계산
 * 서버는 dist/server/에서 실행되므로, 프로젝트 루트는 ../.. (dist/server -> dist -> 프로젝트 루트)
 * utils는 dist/utils/에서 실행되므로, 프로젝트 루트는 ../.. (dist/utils -> dist -> 프로젝트 루트)
 */
function getRootDir(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // utils는 dist/utils/에서 실행되므로, 프로젝트 루트는 ../..
  return join(__dirname, "..", "..");
}

export const rootDir = getRootDir();

/**
 * 클라이언트 매니페스트 로드
 */
export function loadClientManifest(): Record<string, string> {
  let clientManifest: Record<string, string> = {};
  try {
    const manifestPath = join(rootDir, "dist", "react-client-manifest.json");
    const manifestContent = readFileSync(manifestPath, "utf-8");
    clientManifest = JSON.parse(manifestContent);
    console.log(
      "📋 클라이언트 매니페스트 로드 완료:",
      Object.keys(clientManifest).length,
      "개 모듈"
    );
  } catch (error) {
    console.warn("⚠️ 클라이언트 매니페스트를 로드할 수 없습니다:", error);
  }
  return clientManifest;
}

/**
 * 클라이언트 컴포넌트를 동적으로 로드하는 헬퍼 함수
 * 서버에서 실행 시 클라이언트 컴포넌트는 실행되지 않으므로 빈 컴포넌트 반환
 * RSC 렌더러가 클라이언트 컴포넌트를 감지하므로 실제로는 사용되지 않음
 */
export async function loadClientComponent(componentName: string) {
  try {
    // 클라이언트 컴포넌트 경로 (서버에서는 존재하지 않지만, import 에러를 방지하기 위해 시도)
    const componentPath = join(
      rootDir,
      "dist",
      "components",
      `${componentName}.js`
    );
    if (existsSync(componentPath)) {
      const module = await import(componentPath);
      return module.default;
    }
  } catch (error) {
    // 클라이언트 컴포넌트는 서버에서 실행되지 않으므로 에러 무시
  }
  // 가짜 컴포넌트 반환 (RSC 렌더러가 실제 클라이언트 컴포넌트를 처리함)
  return function FakeComponent() {
    return null;
  };
}

/**
 * 서버 시작 시 필요한 클라이언트 컴포넌트 가짜 모듈 미리 생성
 * 페이지 컴포넌트에서 사용하는 클라이언트 컴포넌트를 찾아서 생성
 */
export function createFakeClientComponents(
  componentNames: string[] = ["Counter"]
) {
  const componentsDir = join(rootDir, "dist", "components");
  if (!existsSync(componentsDir)) {
    mkdirSync(componentsDir, { recursive: true });
  }

  for (const componentName of componentNames) {
    const fakeComponentPath = join(componentsDir, `${componentName}.js`);
    if (!existsSync(fakeComponentPath)) {
      writeFileSync(
        fakeComponentPath,
        `export default function ${componentName}() { return null; }`,
        "utf-8"
      );
      console.log(`✅ 클라이언트 컴포넌트 가짜 모듈 생성: ${componentName}`);
    }
  }
}

