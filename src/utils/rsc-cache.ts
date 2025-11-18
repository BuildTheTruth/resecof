import { fetchRSC, clearSuspenseChunks } from "./rsc-client.js";

// RSC Cache
const rscCache = new Map<string, Promise<any>>();
let lastLocation: string | null = null;

// RSC 페이로드를 가져오는 함수 (캐싱 포함)
// 동일 location에 대한 중복 요청을 방지하되, 요청이 완료되면 캐시를 비워 항상 새로운 Promise를 생성
export function getRSCPayload(location: string) {
  // location이 변경되면 Suspense 청크를 정리
  if (lastLocation !== null && lastLocation !== location) {
    clearSuspenseChunks();
  }
  lastLocation = location;

  // 캐시에 있으면 기존 Promise 반환 (중복 요청 방지)
  if (rscCache.has(location)) {
    return rscCache.get(location)!;
  }

  // 캐시에 없으면 새로운 Promise 생성 및 캐싱
  const fetchPromise = fetchRSC(location);
  const trackedPromise = fetchPromise.finally(() => {
    // Promise가 완료되면 캐시에서 제거하여 이후 동일 location 요청 시 다시 fetch
    if (rscCache.get(location) === trackedPromise) {
      rscCache.delete(location);
    }
  });
  rscCache.set(location, trackedPromise);

  return trackedPromise;
}
