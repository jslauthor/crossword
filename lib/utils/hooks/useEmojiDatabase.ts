'use client';

import Database from 'emoji-picker-element/database';
import type { NativeEmoji } from 'emoji-picker-element/shared';
import { useEffect, useState } from 'react';

let database: Database | undefined;
if (typeof window !== 'undefined') {
  database = new Database();
}

type Category = {
  label: string;
  unicode: string;
  group: number;
};

export const CATEGORIES: Category[] = [
  { label: 'Smileys & Emotion', unicode: 'u1f600', group: 0 },
  { label: 'People & Body', unicode: 'u1f44b', group: 1 },
  { label: 'Animals & Nature', unicode: 'u1f431', group: 3 },
  { label: 'Food & Drink', unicode: 'u1f34e', group: 4 },
  { label: 'Travel & Places', unicode: 'u1f3e0', group: 5 },
  { label: 'Activities', unicode: 'u26bd', group: 6 },
  { label: 'Objects', unicode: 'u1f4dd', group: 7 },
  { label: 'Symbols', unicode: 'u26d4', group: 8 },
  { label: 'Flags', unicode: 'u1f3c1', group: 9 },
];

const useEmojiDatabase = (searchQuery: string, group: number) => {
  const [queryResult, setResult] = useState<NativeEmoji[]>([]);

  console.log(group);

  useEffect(() => {
    const query = async () => {
      if (searchQuery.length > 0) {
        const result = (await database?.getEmojiBySearchQuery(
          searchQuery,
        )) as NativeEmoji[];
        setResult(result);
      } else {
        const result = (await database?.getEmojiByGroup(
          group,
        )) as NativeEmoji[];
        setResult(result);
      }
    };
    query();
  }, [searchQuery, group]);

  return {
    queryResult,
  };
};

export default useEmojiDatabase;
