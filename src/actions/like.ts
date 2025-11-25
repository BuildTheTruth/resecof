/**
 * 서버 액션: 포스트 좋아요
 *
 * 서버 액션은 서버에서 실행되는 함수로, 폼의 action prop에 직접 전달할 수 있습니다.
 * 클라이언트에서 호출되면 서버로 요청이 전송되고, 서버에서 실행된 후 결과가 반환됩니다.
 */

// 간단한 메모리 스토어 (실제로는 DB를 사용)
const likesStore = new Map<string, number>();

/**
 * 포스트 좋아요 서버 액션
 * @param postId - 포스트 ID
 * @returns 좋아요 수
 */
export async function likePost(postId: string): Promise<number> {
  // 실제로는 DB 업데이트 등이 여기서 일어남
  const currentLikes = likesStore.get(postId) || 0;
  const newLikes = currentLikes + 1;
  likesStore.set(postId, newLikes);

  // 지연 시뮬레이션 (실제 네트워크 요청처럼)
  await new Promise((resolve) => setTimeout(resolve, 300));

  return newLikes;
}

/**
 * 포스트 좋아요 수 가져오기
 * @param postId - 포스트 ID
 * @returns 좋아요 수
 */
export async function getPostLikes(postId: string): Promise<number> {
  return likesStore.get(postId) || 0;
}
