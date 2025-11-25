/**
 * 서버 액션 처리 유틸리티
 */

import { Request, Response } from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 서버 액션 요청 처리
 * POST /_actions 엔드포인트에서 호출됨
 */
export async function handleServerAction(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { actionId, args } = req.body;

    if (!actionId) {
      res.status(400).json({
        type: "error",
        error: "actionId is required",
      });
      return;
    }

    const functionName = req.body.functionName || "default";
    console.log(`🔧 서버 액션 실행: ${actionId}.${functionName}`, args);

    // 액션 함수 동적 로드
    // actionId 형식: "actions/like" → "dist/actions/like.js"
    const actionPath = join(__dirname, "..", "..", "dist", actionId + ".js");

    const actionModule = await import(actionPath);

    // 액션 함수 이름으로 함수 찾기
    const actionFunction = actionModule[functionName] || actionModule.default;

    if (typeof actionFunction !== "function") {
      res.status(400).json({
        type: "error",
        error: `Action function not found: ${functionName}`,
      });
      return;
    }

    // 서버 액션 실행
    const result = await actionFunction(...(args || []));

    // 결과 반환
    res.json({
      type: "success",
      data: result,
    });
  } catch (error) {
    console.error("❌ 서버 액션 에러:", error);
    res.status(500).json({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
