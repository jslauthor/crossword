import { useUser } from '@clerk/nextjs';
import { getReplicache } from 'lib/replicache';
import { Mutators } from 'lib/replicache/mutators';
import localforage from 'localforage';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { Replicache } from 'replicache';

export const ANONYMOUS_PLAYER_STORAGE_KEY =
  'ANONYMOUS_PLAYER_STORAGE_KEY-CROSSCUBE';

export const usePuzzleCache = (puzzleId: string, isInitialized: boolean) => {
  const { user } = useUser();
  const [replicache, setReplicache] = useState<Replicache<Mutators> | null>(
    null,
  );
  const [hasSynced, setHasSynced] = useState<boolean>(false);
  const [cacheId, setCacheId] = useState(user?.id);

  // TODO When merging the local with the user state, you might need to prompt the
  // user to choose which state to keep.

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
        setCacheId(`${anonymousKey}:${puzzleId}`);
      };
      getCacheId();
    } else {
      setCacheId(`${user?.id}:${puzzleId}`);
    }
  }, [puzzleId, user?.id]);

  // Initialize Replicache
  useEffect(() => {
    if (cacheId == null || isInitialized == false) return;
    const initiate = async () => {
      const rep = await getReplicache(cacheId, user?.id == null);
      rep.onSync = setHasSynced;
      setReplicache(rep);
    };
    initiate();
  }, [cacheId, isInitialized, user?.id]);

  return {
    replicache,
    cacheId,
    hasSynced: replicache?.online === false || hasSynced || user?.id == null,
  };
};
