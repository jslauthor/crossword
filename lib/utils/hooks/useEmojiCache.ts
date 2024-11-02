import { useEffect, useState } from 'react';
import { SVG_BASE_PATH } from './useSvgAtlas';

interface Base64Cache {
  [key: string]: string;
}

export async function getBase64Image(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const base64Cache: Base64Cache = {};

const useEmojiCache = (emoji: string) => {
  let [cachedEmoji, setCachedEmoji] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (base64Cache[emoji]) {
      setCachedEmoji(base64Cache[emoji]);
      setIsLoading(false);
      return;
    }

    const loadEmoji = async () => {
      const imgPath = `${SVG_BASE_PATH}${emoji}.svg`;
      const base64 = await getBase64Image(imgPath);
      setIsLoading(false);
      base64Cache[emoji] = base64;
      setCachedEmoji(base64Cache[emoji]);
      return;
    };

    setIsLoading(true);
    loadEmoji();
  }, [emoji]);

  return { cachedEmoji, isLoading };
};

export default useEmojiCache;
