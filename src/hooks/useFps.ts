'use client';

import { useEffect, useState } from 'react';

/**
 * 브라우저 rAF 콜백 호출 빈도를 1초 단위로 집계해서 FPS를 돌려준다.
 * 캔버스가 실제로 다시 그려진 빈도가 아닌 브라우저 프레임 호출 빈도(보통 60Hz)이므로,
 * 무거운 작업으로 메인 스레드가 막혔을 때 FPS 하락이 나타난다.
 */
export function useFps(): number {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let rafId = 0;

    const tick = () => {
      frames += 1;
      const now = performance.now();
      const elapsed = now - lastTime;
      if (elapsed >= 1000) {
        setFps(Math.round((frames * 1000) / elapsed));
        frames = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}
