import { Request, Response } from "express";
import { FAKE_POSTS, delay } from "./__mock__.js";

/**
 * 포스트 관련 API 엔드포인트
 */

/**
 * GET /api/posts
 * 블로그 포스트 목록 가져오기
 */
export async function getPosts(req: Request, res: Response) {
  try {
    const delayMs = parseInt(req.query.delay as string) || 500;
    await delay(delayMs);

    res.json({
      success: true,
      data: FAKE_POSTS,
    });
  } catch (error) {
    console.error("❌ 포스트 목록 조회 에러:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/posts/:id
 * 특정 블로그 포스트 가져오기
 */
export async function getPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const delayMs = parseInt(req.query.delay as string) || 800;
    await delay(delayMs);

    const post = FAKE_POSTS.find((p) => p.id === id);

    if (!post) {
      res.status(404).json({
        success: false,
        error: `Post with id "${id}" not found`,
      });
      return;
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("❌ 포스트 조회 에러:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
