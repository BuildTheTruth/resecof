# 2주차: 번들링 & 경계 & 파일 라우팅

## 1. 목표

- **서버/클라이언트 번들 분리** + **클라이언트 매니페스트** 생성
- **파일 기반 라우터**: `src/pages/(route)/page.tsx` 인식 → location 매핑
- **디렉토리 구조 정리**: `src/` 루트 구조로 통합
- **코드 리팩토링**: 엔드포인트와 비즈니스 로직 분리

### ✅ 완료 사항

- [x] esbuild로 서버/클라이언트 번들 분리
- [x] 클라이언트 매니페스트 생성 (모듈ID → 정적자원 URL)
- [x] 파일 기반 라우터 구현 (`src/pages/*/page.tsx`)
- [x] 클라이언트 컴포넌트 import 에러 처리 (가짜 모듈 생성)
- [x] 디렉토리 구조 정리 (`client/` 제거, `src/` 구조로 통합)
- [x] 코드 리팩토링 (`src/utils/`로 분리)
- [x] 불필요한 코드 제거

---

## 2. 구현 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────┐
│           Browser (클라이언트)             │
│  ┌──────────────────────────────────┐   │
│  │  dist/public/main.js             │   │
│  │  - 클라이언트 번들                  │   │
│  │  - 클라이언트 컴포넌트 포함           │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    ⬇ HTTP
┌─────────────────────────────────────────┐
│          Server (Express)               │
│  ┌──────────────────────────────────┐   │
│  │  dist/server/index.js             │   │
│  │  - 서버 번들                       │   │
│  │  - 파일 기반 라우터                 │   │
│  │  - RSC 스트림 생성                  │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  dist/pages/*/page.js             │   │
│  │  - 페이지 컴포넌트 (서버 컴포넌트)    │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 프로젝트 구조

```
resecof/
├── src/
│   ├── server/
│   │   └── index.ts              # Express 서버 (엔드포인트만)
│   ├── pages/
│   │   ├── home/
│   │   │   └── page.tsx          # 파일 기반 라우터
│   │   └── about/
│   │       └── page.tsx
│   ├── components/
│   │   └── Counter.tsx           # 클라이언트 컴포넌트
│   ├── utils/
│   │   ├── server-config.ts      # 서버 설정
│   │   ├── route-scanner.ts      # 라우트 스캔
│   │   ├── route-handlers.ts     # 라우트 핸들러
│   │   ├── rsc-renderer.ts       # RSC 렌더러
│   │   └── rsc-client.ts         # RSC 클라이언트
│   ├── App.tsx                   # 서버 컴포넌트
│   └── main.tsx                  # 클라이언트 엔트리
├── scripts/
│   └── build.mjs                 # 빌드 스크립트
└── dist/
    ├── server/
    │   └── index.js              # 서버 번들
    ├── pages/
    │   └── */page.js             # 페이지 컴포넌트
    ├── public/
    │   └── main.js               # 클라이언트 번들
    ├── components/
    │   └── Counter.js            # 가짜 모듈 (서버용)
    └── react-client-manifest.json # 클라이언트 매니페스트
```

---

## 3. 핵심 구현 내용

### 3.1 서버/클라이언트 번들 분리

#### `scripts/build.mjs`

esbuild를 사용하여 서버와 클라이언트 번들을 분리합니다.

**클라이언트 번들:**

- 엔트리: `src/main.tsx`
- 출력: `dist/public/`
- 플랫폼: `browser`
- `src/server/` 디렉토리 제외

**서버 번들:**

- 엔트리: `src/server/index.ts`
- 출력: `dist/server/index.js`
- 플랫폼: `node`
- `src/components/` 디렉토리 제외 (클라이언트 컴포넌트)

**페이지 컴포넌트 트랜스파일:**

- `src/pages/*/page.tsx` → `dist/pages/*/page.js`
- 서버에서 동적 import로 로드

```javascript
// 클라이언트 번들
await esbuild.build({
  entryPoints: [join(rootDir, "src", "main.tsx")],
  bundle: true,
  outdir: publicDir,
  platform: "browser",
  plugins: [
    {
      name: "exclude-server",
      setup(build) {
        build.onResolve({ filter: /^src\/server\// }, (args) => {
          return { path: args.path, external: true };
        });
      },
    },
  ],
});

// 서버 번들
await esbuild.build({
  entryPoints: [join(rootDir, "src", "server", "index.ts")],
  bundle: true,
  outfile: join(serverDir, "index.js"),
  platform: "node",
  plugins: [
    {
      name: "exclude-client",
      setup(build) {
        build.onResolve({ filter: /^src\/components\// }, (args) => {
          return { path: args.path, external: true };
        });
      },
    },
  ],
});
```

### 3.2 클라이언트 매니페스트 생성

빌드 시 클라이언트 컴포넌트의 모듈 ID와 정적 자원 URL을 매핑하는 매니페스트를 생성합니다.

```javascript
// 클라이언트 매니페스트 생성
const clientManifest = {};
if (clientBuildResult.metafile) {
  const outputs = clientBuildResult.metafile.outputs;
  for (const [outputPath, output] of Object.entries(outputs)) {
    const relativePath = relative(publicDir, outputPath);
    const publicUrl = `/dist/public/${relativePath.replace(/\\/g, "/")}`;

    // 모듈 ID → URL 매핑
    for (const inputPath of Object.keys(output.inputs)) {
      const moduleId = relative(rootDir, inputPath);
      clientManifest[moduleId] = publicUrl;
    }
  }
}

// 매니페스트 파일 저장
writeFileSync(
  join(distDir, "react-client-manifest.json"),
  JSON.stringify(clientManifest, null, 2),
  "utf-8"
);
```

**매니페스트 예시:**

```json
{
  "src/components/Counter.tsx": "/dist/public/main.js",
  "src/main.tsx": "/dist/public/main.js",
  "Counter": "/dist/public/main.js"
}
```

### 3.3 파일 기반 라우터

`src/pages/` 디렉토리를 스캔하여 자동으로 라우트를 생성합니다.

#### `src/utils/route-scanner.ts`

```typescript
export function scanRoutes(pagesDir: string): RouteMap {
  const routes = new Map<string, () => Promise<any>>();

  function scanDirectory(dir: string, basePath: string = "") {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        scanDirectory(fullPath, routePath);
      } else if (entry.name === "page.tsx" || entry.name === "page.js") {
        // basePath가 /home이면 / 또는 /home으로 매핑
        const route = basePath === "/home" ? "/" : basePath;
        const importPath = `../pages/${relativePath}`;

        const routeLoader = async () => {
          const module = await import(importPath);
          return module.default;
        };

        routes.set(route, routeLoader);
      }
    }
  }

  scanDirectory(pagesDir);
  return routes;
}
```

**라우트 매핑 규칙:**

- `src/pages/home/page.tsx` → `/` 또는 `/home`
- `src/pages/about/page.tsx` → `/about`
- 새 파일 추가 시 자동으로 라우트 등록

### 3.4 클라이언트 컴포넌트 import 에러 처리

서버에서 페이지 컴포넌트를 로드할 때 클라이언트 컴포넌트 import 에러가 발생하므로, 가짜 모듈을 생성하여 우회합니다.

#### `src/utils/server-config.ts`

```typescript
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
    }
  }
}
```

**동작 방식:**

1. 서버 시작 시 필요한 클라이언트 컴포넌트 가짜 모듈 미리 생성
2. 페이지 컴포넌트 로드 시 클라이언트 컴포넌트 import 에러 발생
3. 가짜 모듈이 이미 생성되어 있으므로 import 성공
4. RSC 렌더러가 실제 클라이언트 컴포넌트를 감지하여 처리

### 3.5 코드 리팩토링

엔드포인트와 비즈니스 로직을 분리하여 유지보수성을 향상시켰습니다.

#### `src/server/index.ts` (엔드포인트만)

```typescript
import express from "express";
import {
  loadClientManifest,
  createFakeClientComponents,
} from "../utils/server-config.js";
import { scanRoutes } from "../utils/route-scanner.js";
import { createRouteHandler } from "../utils/route-handlers.js";

const PORT = 3000;

const clientManifest = loadClientManifest();
createFakeClientComponents(["Counter"]);

const pagesDir = join(__dirname, "..", "..", "dist", "pages");
const routes = scanRoutes(pagesDir);

const app = express();
app.use("/dist/public", express.static(publicDir));

const handleRoute = createRouteHandler(routes, clientManifest);

for (const route of routes.keys()) {
  app.get(route, handleRoute);
}

app.listen(PORT, () => {
  console.log(`✨ 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
});
```

#### 분리된 유틸리티 모듈

- **`src/utils/server-config.ts`**: 서버 설정, 매니페스트 로드, 가짜 모듈 생성
- **`src/utils/route-scanner.ts`**: 파일 기반 라우터 스캔
- **`src/utils/route-handlers.ts`**: RSC/HTML 요청 핸들러

---

## 4. 디렉토리 구조 변경

### 변경 전

```
resecof/
├── server/
│   ├── entry.ts
│   └── rsc-renderer.ts
├── client/
│   ├── main.tsx
│   └── components/
│       └── Counter.client.tsx
└── shared/
    └── App.server.tsx
```

### 변경 후

```
resecof/
├── src/
│   ├── server/
│   │   └── index.ts
│   ├── pages/
│   │   ├── home/
│   │   │   └── page.tsx
│   │   └── about/
│   │       └── page.tsx
│   ├── components/
│   │   └── Counter.tsx
│   ├── utils/
│   │   ├── server-config.ts
│   │   ├── route-scanner.ts
│   │   ├── route-handlers.ts
│   │   ├── rsc-renderer.ts
│   │   └── rsc-client.ts
│   ├── App.tsx
│   └── main.tsx
```

**주요 변경 사항:**

- `client/` 디렉토리 제거 → `src/` 루트로 통합
- `server/` → `src/server/`
- `shared/` → `src/` (App.tsx)
- 파일명에서 `.client`, `.server` 확장자 제거
- 디렉토리 구조로 서버/클라이언트 구분

---

## 5. 빌드 프로세스

### 빌드 단계

1. **클라이언트 번들 생성**

   - `src/main.tsx` → `dist/public/main.js`
   - 클라이언트 컴포넌트 포함
   - 코드 스플리팅 활성화

2. **클라이언트 매니페스트 생성**

   - 모듈 ID → 정적 자원 URL 매핑
   - `dist/react-client-manifest.json` 저장

3. **페이지 컴포넌트 트랜스파일**

   - `src/pages/*/page.tsx` → `dist/pages/*/page.js`
   - 서버에서 동적 import로 로드

4. **서버 번들 생성**
   - `src/server/index.ts` → `dist/server/index.js`
   - 서버 컴포넌트 포함
   - 클라이언트 컴포넌트 제외

### 빌드 명령어

```bash
npm run build
```

**빌드 결과:**

```
dist/
├── server/
│   └── index.js              # 서버 번들
├── pages/
│   ├── home/
│   │   └── page.js
│   └── about/
│       └── page.js
├── public/
│   └── main.js               # 클라이언트 번들
└── react-client-manifest.json # 클라이언트 매니페스트
```

---

## 6. 데모 및 결과

### 6.1 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 빌드
npm run build

# 3. 서버 실행
npm run dev
```

### 6.2 파일 기반 라우터 동작

1. **기존 라우트**

   - `src/pages/home/page.tsx` → `/` 또는 `/home`
   - `src/pages/about/page.tsx` → `/about`

2. **새 라우트 추가**
   - `src/pages/contact/page.tsx` 파일 생성
   - 빌드 후 자동으로 `/contact` 라우트 등록
   - 서버 재시작 없이 라우트 인식

### 6.3 클라이언트 매니페스트 활용

서버에서 RSC 스트림을 생성할 때 클라이언트 컴포넌트의 URL을 매니페스트에서 찾아 전달합니다.

```typescript
// RSC 렌더러에서 클라이언트 컴포넌트 URL 찾기
const componentUrl =
  clientManifest[componentName] ||
  clientManifest[`src/components/${componentName}.tsx`] ||
  clientManifest[`components/${componentName}.tsx`];
```

### 6.4 완료 기준 달성

- ✅ 파일 추가만으로 새 라우트가 자동 반영
- ✅ 서버/클라이언트 번들 분리 완료
- ✅ 클라이언트 매니페스트 생성 및 활용
- ✅ 클라이언트 컴포넌트 import 에러 처리
- ✅ 코드 리팩토링으로 유지보수성 향상

---

## 7. 학습 내용 및 다음 단계

### 7.1 주요 학습 내용

#### 번들링 전략

- 서버와 클라이언트 번들을 분리하여 각각 최적화
- esbuild 플러그인으로 cross-bundle import 제외
- 코드 스플리팅으로 초기 로딩 시간 단축

#### 파일 기반 라우팅

- 디렉토리 구조로 라우트 자동 생성
- 동적 import로 페이지 컴포넌트 로드
- 확장 가능한 라우팅 시스템

#### 클라이언트 컴포넌트 처리

- 서버에서 클라이언트 컴포넌트를 직접 실행하지 않음
- 가짜 모듈로 import 에러 우회
- RSC 렌더러가 클라이언트 컴포넌트를 감지하여 처리

#### 코드 구조화

- 엔드포인트와 비즈니스 로직 분리
- 유틸리티 모듈로 재사용성 향상
- 명확한 책임 분리

### 7.2 구현의 한계 (2주차)

- ❌ HMR 미지원
- ❌ 서버 액션 미구현
- ❌ 에러 바운더리 미구현
- ❌ Suspense 스트리밍 최적화 미구현

### 7.3 다음 단계 (3주차)

1. **데이터 패칭 & Suspense**

   - 서버 컴포넌트에서 DB/API 접근
   - Suspense 경계로 부분 스트리밍
   - Flight 응답 캐시

2. **서버 액션 & DX**
   - 서버 액션 구현
   - HMR 지원
   - 프로덕션 빌드 최적화

---

## 🔗 참고 자료

- [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [Next.js App Router](https://nextjs.org/docs/app)
- [esbuild Documentation](https://esbuild.github.io/)
- [demystify-react-server-components](https://github.com/JSerZANP/demystify-react-server-components)
