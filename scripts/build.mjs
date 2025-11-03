import * as esbuild from "esbuild";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// public 디렉토리 생성
const publicDir = join(rootDir, "public");
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

console.log("🔨 빌드 시작...");

// 1. 클라이언트 번들 생성
console.log("📦 클라이언트 번들 생성 중...");
await esbuild.build({
  entryPoints: [join(rootDir, "client/main.tsx")],
  bundle: true,
  outfile: join(publicDir, "client.js"),
  format: "esm",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  sourcemap: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  external: [], // 모든 의존성을 번들에 포함
});

console.log("✅ 클라이언트 번들 생성 완료: public/client.js");

// 2. 서버 파일 트랜스파일
console.log("🔧 서버 파일 트랜스파일 중...");
await esbuild.build({
  entryPoints: [
    join(rootDir, "server/entry.ts"),
    join(rootDir, "server/rsc-renderer.ts"),
    join(rootDir, "shared/App.server.tsx"),
    join(rootDir, "shared/Counter.client.tsx"),
  ],
  outdir: join(rootDir, "dist"),
  format: "esm",
  platform: "node",
  target: "node18",
  jsx: "automatic",
  sourcemap: true,
  packages: "external", // node_modules는 번들하지 않음
});

console.log("✅ 서버 파일 트랜스파일 완료: dist/");

console.log("");
console.log("✨ 빌드 완료!");
console.log("");
console.log("실행하려면:");
console.log("  npm install  # 의존성 설치");
console.log("  node dist/server/entry.js  # 서버 실행");
