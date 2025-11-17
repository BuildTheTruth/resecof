import { Request, Response } from "express";
import { FAKE_USERS, delay } from "./__mock__/index.js";

/**
 * 사용자 관련 API 엔드포인트
 */

/**
 * GET /api/users/:id
 * 특정 사용자 정보 가져오기
 */
export async function getUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const delayMs = parseInt(req.query.delay as string) || 600;
    await delay(delayMs);

    const user = FAKE_USERS.find((u) => u.id === id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: `User with id "${id}" not found`,
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ 사용자 조회 에러:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
