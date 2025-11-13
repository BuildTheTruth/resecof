import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";

/**
 * 서버 설정 및 유틸리티 함수
 */

function getRootDir(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
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
