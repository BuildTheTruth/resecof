import { fetchRSC, clearSuspenseChunks } from "./rsc-client.js";

// RSC Cache
const rscCache = new Map<string, Promise<any>>();
let lastLocation: string | null = null;

// RSC 페이로드를 가져오는 함수 (캐싱 포함)
// location이 변경될 때마다 새로운 Promise를 생성하여 React가 변경을 감지하도록 함
export function getRSCPayload(location: string) {
  // location이 변경되면 Suspense 청크를 정리하고 캐시도 무효화
  if (lastLocation !== null && lastLocation !== location) {
    clearSuspenseChunks();
    // 캐시를 무효화하여 새로운 Promise를 생성하도록 함
    rscCache.delete(location);
  }
  lastLocation = location;
  
  // 항상 새로운 Promise를 생성하여 React가 변경을 감지하도록 함
  // 캐시는 나중에 최적화를 위해 사용할 수 있음
  const promise = fetchRSC(location);
  rscCache.set(location, promise);
  
  return promise;
}

