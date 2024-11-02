import { useEffect, useState } from 'react';
import { SVG_BASE_PATH } from './useSvgAtlas';
import pLimit from 'p-limit';

interface Base64Cache {
  [key: string]: string;
}

// Add a concurrency limit (e.g., 3 requests at a time)
const limit = pLimit(20);
const base64Cache: Base64Cache = {};
const pendingRequests: Map<string, Promise<string>> = new Map();

export async function getBase64Image(url: string): Promise<string> {
  // Check if there's already a pending request for this URL
  const pending = pendingRequests.get(url);
  if (pending) return pending;

  const fetchOperation = limit(async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } finally {
      // Clean up the pending request after it's done
      pendingRequests.delete(url);
    }
  });

  // Store the pending request
  pendingRequests.set(url, fetchOperation);
  return fetchOperation;
}

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
