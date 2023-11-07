import { useEffect, useMemo, useRef, useState } from 'react';
import { randomIntFromInterval } from '../math';

export const useAnimatedText = (
  text: string | undefined,
  delay: number = 0,
) => {
  const [animatedText, setAnimatedText] = useState('');
  const intervalRef = useRef<string | number | NodeJS.Timeout | undefined>();
  const currentTextTokens = useMemo(() => {
    if (text == null) return '';
    setAnimatedText('');
    return text.split(' ');
  }, [text]);

  useEffect(() => {
    if (currentTextTokens.length <= 0) {
      setAnimatedText('');
      clearInterval(intervalRef.current);
      return;
    }

    let i = 0;
    intervalRef.current = setInterval(
      async () => {
        if (i < currentTextTokens.length) {
          const updateState = (token: string) =>
            new Promise((resolve) => {
              setAnimatedText((prev) => prev + ' ' + token);
              resolve(true);
            });
          await updateState(currentTextTokens[i]);
          i++;
        } else {
          clearInterval(intervalRef.current);
        }
      },
      randomIntFromInterval(delay * 0.4, delay * 1.6),
    );

    return () => clearInterval(intervalRef.current);
  }, [currentTextTokens, delay]);

  return animatedText;
};
