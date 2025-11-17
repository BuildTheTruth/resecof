/**
 * 포스트 관련 데이터 페칭 함수
 */

import { FAKE_POSTS, delay } from "./__mock__/index.js";

export type Post = (typeof FAKE_POSTS)[0];

/**
 * 블로그 포스트 목록 가져오기
 * @param delayMs - 지연 시간 (밀리초, 기본값: 500ms)
 */
export async function getPosts(delayMs: number = 500): Promise<Post[]> {
  await delay(delayMs);
  return FAKE_POSTS;
}

/**
 * 특정 블로그 포스트 가져오기
 * @param id - 포스트 ID
 * @param delayMs - 지연 시간 (밀리초, 기본값: 800ms)
 */
export async function getPost(
  id: string,
  delayMs: number = 800
): Promise<Post | null> {
  await delay(delayMs);
  const post = FAKE_POSTS.find((p) => p.id === id);
  return post || null;
}
