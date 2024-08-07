import { useCallback, useEffect } from 'react';

export const useKeyDown = (
  callBack: (pressedKey: string) => any,
  key: string | string[],
  caseInsensitive: boolean = true,
  disabled?: boolean,
  preventDefault?: boolean,
) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const pressedKey = event.key;
      const normalizedPressedKey = caseInsensitive
        ? pressedKey.toUpperCase()
        : pressedKey;

      if (
        key === '_all' ||
        (typeof key === 'string' && key === normalizedPressedKey) ||
        (Array.isArray(key) && key.includes(normalizedPressedKey))
      ) {
        if (preventDefault) {
          event.preventDefault();
        }

        callBack(normalizedPressedKey);
      }
    },
    [callBack, caseInsensitive, key, preventDefault],
  );

  useEffect(() => {
    if (disabled) return;
    document.addEventListener('keydown', handleKeyDown, false);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });
};
