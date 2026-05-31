import { useCallback, useRef } from 'react';

/**
 * WAI-ARIA radiogroup 키보드 패턴 — 좌·우(또는 상·하) 방향키로 선택을 순환,
 * Home/End로 첫·끝 이동. 선택과 포커스가 함께 이동한다(follow focus).
 * 호출처는 onKeyDown을 컨테이너에 걸고, 각 항목 ref를 itemRef 콜백으로 등록한다.
 */
export function useRadioGroupKeyboard<T extends string>(
  values: readonly T[],
  current: T,
  onSelect: (v: T) => void,
) {
  const refs = useRef<Map<T, HTMLButtonElement>>(new Map());

  const setItemRef = useCallback(
    (value: T) => (el: HTMLButtonElement | null) => {
      if (el) refs.current.set(value, el);
      else refs.current.delete(value);
    },
    [],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = values.indexOf(current);
      let next = idx;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % values.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
        next = (idx - 1 + values.length) % values.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = values.length - 1;
      else return;
      e.preventDefault();
      const v = values[next];
      onSelect(v);
      refs.current.get(v)?.focus();
    },
    [values, current, onSelect],
  );

  return { onKeyDown, setItemRef };
}
