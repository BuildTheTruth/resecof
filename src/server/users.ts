/**
 * 사용자 관련 데이터 페칭 함수
 */

import { FAKE_USERS, delay } from "./__mock__/index.js";

export type User = (typeof FAKE_USERS)[0];

/**
 * 사용자 정보 가져오기
 * @param id - 사용자 ID
 * @param delayMs - 지연 시간 (밀리초, 기본값: 600ms)
 */
export async function getUser(
  id: string,
  delayMs: number = 600
): Promise<User | null> {
  await delay(delayMs);
  const user = FAKE_USERS.find((u) => u.id === id);
  return user || null;
}
