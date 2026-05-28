/**
 * 이미지 URL 단위 캐시. drawImage가 동기 API라 미리 로드된 HTMLImageElement를 들고 있어야 한다.
 * 처음 요청 시 비동기 로드를 트리거하고, 로드가 끝나면 등록된 listener에게 알린다.
 */
const cache = new Map<string, HTMLImageElement>();
const listeners = new Set<() => void>();

/** URL에 해당하는 로드 완료된 이미지를 돌려준다. 아직이면 null + 백그라운드 로드 시작. */
export function getCachedImage(url: string): HTMLImageElement | null {
  const cached = cache.get(url);
  if (cached) {
    return cached.complete && cached.naturalWidth > 0 ? cached : null;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => listeners.forEach((l) => l());
  img.onerror = () => {
    // 실패한 항목은 캐시에서 제거해 다음 호출에 재시도 가능하게 한다.
    cache.delete(url);
    listeners.forEach((l) => l());
  };
  img.src = url;
  cache.set(url, img);
  return null;
}

/** 이미지 로드/실패 시 호출될 콜백을 등록한다. unsubscribe 함수를 돌려준다. */
export function subscribeImageEvents(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
