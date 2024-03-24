import { Replicache } from 'replicache';
import { Mutators, mutators } from './mutators';

const replicacheMap = new Map();

export const getReplicache = async (
  name: string,
  offline: boolean,
): Promise<Replicache<Mutators>> => {
  if (replicacheMap.has(name)) {
    return replicacheMap.get(name);
  }

  const [userId, puzzleId] = name.split(':');
  const params = `?userId=${userId}&puzzleId=${puzzleId}`;

  replicacheMap.set(
    name,
    new Replicache<Mutators>({
      name,
      licenseKey: process.env.NEXT_PUBLIC_REPLICACHE_TOKEN!,
      mutators,
      pushURL: offline == true ? undefined : `/api/replicache/push${params}`,
      pullURL: offline == true ? undefined : `/api/replicache/pull${params}`,
    }),
  );

  return replicacheMap.get(name);
};
