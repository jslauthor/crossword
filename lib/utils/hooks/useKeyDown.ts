import { useEffect } from 'react';

export const useKeyDown = (
  callBack: (pressedKey: string) => any,
  key: string | string[],
  caseInsensitive: boolean = true,
  disabled?: boolean
) => {
  const handleKeyDown = ({ key: pressedKey }: KeyboardEvent) => {
    if (key instanceof Array) {
      if (
        !key.includes(
          caseInsensitive === true ? pressedKey.toUpperCase() : pressedKey
        )
      )
        return;
    } else {
      if (key !== '_all' && key !== pressedKey) return;
    }

    callBack(caseInsensitive === true ? pressedKey.toUpperCase() : pressedKey);
  };

  useEffect(() => {
    if (disabled) return;
    document.addEventListener('keydown', handleKeyDown, false);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });
};
