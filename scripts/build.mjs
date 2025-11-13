import * as esbuild from "esbuild";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// 디렉토리 생성
const distDir = join(rootDir, "dist");
const publicDir = join(distDir, "public");
const serverDir = join(distDir, "server");

[distDir, publicDir, serverDir].forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

console.log("🔨 빌드 시작...");

// 1. 클라이언트 번들 생성
console.log("📦 클라이언트 번들 생성 중...");
const clientBuildResult = await esbuild.build({
  entryPoints: [join(rootDir, "src", "main.tsx")],
  bundle: true,
  outdir: publicDir,
  format: "esm",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  splitting: true, // 코드 스플리팅 활성화
  sourcemap: true,
  metafile: true, // 매니페스트 생성을 위해 메타파일 활성화
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  // 클라이언트 컴포넌트만 포함
  plugins: [
    {
      name: "exclude-server",
      setup(build) {
        // src/server/ 디렉토리를 external로 처리
        build.onResolve({ filter: /^src\/server\// }, (args) => {
          return { path: args.path, external: true };
        });
        build.onResolve({ filter: /^\.\.\/server\// }, (args) => {
          return { path: args.path, external: true };
        });
      },
    },
  ],
});

console.log("✅ 클라이언트 번들 생성 완료: dist/public/");

// 2. 클라이언트 매니페스트 생성
console.log("📋 클라이언트 매니페스트 생성 중...");
const clientManifest = {};
if (clientBuildResult.metafile) {
  const outputs = clientBuildResult.metafile.outputs;
  for (const [outputPath, output] of Object.entries(outputs)) {
    // 엔트리 포인트와 청크 파일들을 매니페스트에 추가
    const relativePath = relative(publicDir, outputPath);
    const publicUrl = `/dist/public/${relativePath.replace(/\\/g, "/")}`;

    // main.js는 루트에서도 접근 가능하도록
    if (relativePath === "main.js") {
      clientManifest["__main__"] = publicUrl;
    }

    // 입력 파일들을 모듈 ID로 사용
    if (output.entryPoint) {
      const entryPoint = relative(rootDir, output.entryPoint);
      clientManifest[entryPoint] = publicUrl;
    }

    // 청크 파일들도 매핑 (모듈 경로 → URL)
    for (const inputPath of Object.keys(output.inputs)) {
      // 상대 경로로 변환
      const moduleId = relative(rootDir, inputPath);
      if (!clientManifest[moduleId]) {
        clientManifest[moduleId] = publicUrl;
      }
    }
  }

  // 클라이언트 컴포넌트 이름 → 모듈 ID 매핑도 추가
  const inputs = clientBuildResult.metafile.inputs;
  for (const [inputPath, input] of Object.entries(inputs)) {
    const moduleId = relative(rootDir, inputPath);
    // .client.* 파일인 경우 컴포넌트 이름으로도 매핑
    if (inputPath.includes(".client.")) {
      const componentName = inputPath
        .split(/[/\\]/)
        .pop()
        ?.replace(/\.(tsx?|jsx?)$/, "")
        .replace(/\.client$/, "");
      if (componentName) {
        // 컴포넌트 이름 → URL 매핑
        const outputUrl =
          clientManifest[moduleId] || Object.values(clientManifest)[0];
        if (outputUrl) {
          clientManifest[componentName] = outputUrl;
        }
      }
    }
  }
}

// 매니페스트 파일 저장
const manifestPath = join(distDir, "react-client-manifest.json");
writeFileSync(manifestPath, JSON.stringify(clientManifest, null, 2), "utf-8");
console.log(
  "✅ 클라이언트 매니페스트 생성 완료: dist/react-client-manifest.json"
);

// 3. src/pages/ 디렉토리 트랜스파일 (파일 기반 라우터)
const pagesDir = join(rootDir, "src", "pages");
const distPagesDir = join(distDir, "pages");
if (existsSync(pagesDir)) {
  console.log("📁 src/pages/ 디렉토리 트랜스파일 중...");

  // pages/ 디렉토리에서 모든 page.tsx 파일 찾기
  function findPageFiles(dir, fileList = []) {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        findPageFiles(filePath, fileList);
      } else if (file === "page.tsx" || file === "page.ts") {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  const pageFiles = findPageFiles(pagesDir);

  if (pageFiles.length === 0) {
    console.log("⚠️ src/pages/ 디렉토리에 page.tsx 파일이 없습니다.");
  } else {
    await esbuild.build({
      entryPoints: pageFiles,
      outdir: distPagesDir,
      format: "esm",
      platform: "node",
      target: "node18",
      jsx: "automatic",
      sourcemap: true,
      packages: "external", // node_modules는 번들하지 않음
      plugins: [
        {
          name: "exclude-client-components",
          setup(build) {
            // 클라이언트 컴포넌트는 서버에서 실행하지 않으므로 external로 처리
            // 하지만 pages는 서버 컴포넌트이므로 번들에 포함
          },
        },
      ],
    });
    console.log("✅ src/pages/ 디렉토리 트랜스파일 완료: dist/pages/");
  }
} else {
  console.log("⚠️ src/pages/ 디렉토리가 없습니다. 건너뜁니다.");
}

// 4. 서버 번들 생성
console.log("🔧 서버 번들 생성 중...");
await esbuild.build({
  entryPoints: [join(rootDir, "src", "server", "index.ts")],
  bundle: true,
  outfile: join(serverDir, "index.js"),
  format: "esm",
  platform: "node",
  target: "node18",
  jsx: "automatic",
  sourcemap: true,
  packages: "external", // node_modules는 번들하지 않음
  plugins: [
    {
      name: "exclude-client",
      setup(build) {
        // src/components/ 디렉토리를 external로 처리 (클라이언트 컴포넌트 제외)
        // 하지만 src/App.tsx와 src/pages/는 서버 컴포넌트이므로 포함
        build.onResolve({ filter: /^src\/components\// }, (args) => {
          return { path: args.path, external: true };
        });
        build.onResolve({ filter: /^\.\.\/components\// }, (args) => {
          return { path: args.path, external: true };
        });
      },
    },
  ],
});

console.log("✅ 서버 번들 생성 완료: dist/server/index.js");

console.log("");
console.log("✨ 빌드 완료!");
console.log("");
console.log("실행하려면:");
console.log("  npm install  # 의존성 설치");
console.log("  node dist/server/index.js  # 서버 실행");
