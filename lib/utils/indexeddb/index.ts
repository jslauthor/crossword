'use client';

import Dexie, { type EntityTable } from 'dexie';

export interface Progress {
  id: string;
  data: Uint8Array;
}

export const db = new Dexie('CrosscubeProgress') as Dexie & {
  data: EntityTable<Progress, 'id'>;
};

db.version(1).stores({
  data: '&id, data',
});
