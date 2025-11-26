/**
 * 클라이언트에서 사용할 서버 액션 래퍼
 * 서버 액션 함수를 직접 import하여 타입 안정성 확보
 */

import { createServerActionWrapper } from "../utils/server-action-wrapper.js";

/**
 * 포스트 좋아요 서버 액션 (클라이언트 래퍼)
 * 타입 안정성을 위해 서버 함수와 동일한 시그니처 유지
 */
export const likePost = createServerActionWrapper<
  (postId: string) => Promise<number>
>("actions/like", "likePost");

/**
 * 포스트 좋아요 수 가져오기 (클라이언트 래퍼)
 */
export const getPostLikes = createServerActionWrapper<
  (postId: string) => Promise<number>
>("actions/like", "getPostLikes");
