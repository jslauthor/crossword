'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { RoomProvider } from 'liveblocks.config';
import { ClientSideSuspense } from '@liveblocks/react';
import { createInitialStorage } from 'lib/utils/puzzle';
import { PuzzleType } from 'app/page';
import { LiveObject } from '@liveblocks/client';
import { useUser } from '@clerk/nextjs';
import localforage from 'localforage';
import { nanoid } from 'nanoid';

export const ANONYMOUS_PLAYER_STORAGE_KEY =
  'ANONYMOUS_PLAYER_STORAGE_KEY-CROSSCUBE';

export function Room({
  children,
  puzzle,
}: {
  children: ReactNode;
  puzzle: PuzzleType;
}) {
  const { user } = useUser();
  const [cacheId, setCacheId] = useState<string | null>(null);

  const initialStorage = useMemo(
    () => ({ state: new LiveObject(createInitialStorage(puzzle)) }),
    [puzzle],
  );
  useEffect(() => {
    if (user?.id == null) {
      const getCacheId = async () => {
        let anonymousKey = await localforage.getItem<string>(
          ANONYMOUS_PLAYER_STORAGE_KEY,
        );
        if (anonymousKey == null) {
          anonymousKey = nanoid();
          await localforage.setItem(ANONYMOUS_PLAYER_STORAGE_KEY, anonymousKey);
        }
        setCacheId(`${anonymousKey}:${puzzle.id}`);
      };
      getCacheId();
    } else {
      setCacheId(`${user?.id}:${puzzle.id}`);
    }
  }, [puzzle.id, user?.id]);

  return cacheId != null ? (
    <RoomProvider
      id={cacheId}
      initialPresence={{}}
      initialStorage={initialStorage}
    >
      <ClientSideSuspense fallback={<div>Loading…</div>}>
        {() => children}
      </ClientSideSuspense>
    </RoomProvider>
  ) : null;
}
