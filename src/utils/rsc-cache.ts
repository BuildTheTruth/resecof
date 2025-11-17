import { fetchRSC } from "./rsc-client.js";

// RSC Cache
const rscCache = new Map<string, Promise<any>>();

// RSC 페이로드를 가져오는 함수 (캐싱 포함)
export function getRSCPayload(location: string) {
  if (!rscCache.has(location)) {
    rscCache.set(location, fetchRSC(location));
  }
  return rscCache.get(location)!;
}

