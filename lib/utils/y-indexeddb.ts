import * as Y from 'yjs';
import * as idb from 'lib0/indexeddb';
import * as promise from 'lib0/promise';
import { ObservableV2 } from 'lib0/observable';

const customStoreName = 'custom';
const updatesStoreName = 'updates';

export const PREFERRED_TRIM_SIZE = 500;

export const fetchUpdates = async (
  idbPersistence: IndexeddbPersistence,
  beforeApplyUpdatesCallback: (store: IDBObjectStore) => void = () => {},
  afterApplyUpdatesCallback: (store: IDBObjectStore) => void = () => {},
): Promise<IDBObjectStore> => {
  const [updatesStore] = idb.transact(idbPersistence.db as IDBDatabase, [
    updatesStoreName,
  ]);
  return idb
    .getAll(
      updatesStore,
      idb.createIDBKeyRangeLowerBound(idbPersistence._dbref, false),
    )
    .then((updates) => {
      if (!idbPersistence._destroyed) {
        beforeApplyUpdatesCallback(updatesStore);
        Y.transact(
          idbPersistence.doc,
          () => {
            updates.forEach((val) => Y.applyUpdate(idbPersistence.doc, val));
          },
          idbPersistence,
          false,
        );
        afterApplyUpdatesCallback(updatesStore);
      }
    })
    .then(() =>
      idb.getLastKey(updatesStore).then((lastKey) => {
        idbPersistence._dbref = (lastKey as number) + 1;
      }),
    )
    .then(() =>
      idb.count(updatesStore).then((cnt) => {
        idbPersistence._dbsize = cnt;
      }),
    )
    .then(() => updatesStore);
};

export const storeState = (
  idbPersistence: IndexeddbPersistence,
  forceStore: boolean = true,
): Promise<void> =>
  fetchUpdates(idbPersistence).then((updatesStore) => {
    if (forceStore || idbPersistence._dbsize >= PREFERRED_TRIM_SIZE) {
      idb
        .addAutoKey(updatesStore, Y.encodeStateAsUpdate(idbPersistence.doc))
        .then(() =>
          idb.del(
            updatesStore,
            idb.createIDBKeyRangeUpperBound(idbPersistence._dbref, true),
          ),
        )
        .then(() =>
          idb.count(updatesStore).then((cnt) => {
            idbPersistence._dbsize = cnt;
          }),
        );
    }
  });

export const clearDocument = (name: string): Promise<void> =>
  idb.deleteDB(name);

export class IndexeddbPersistence extends ObservableV2<any> {
  doc: Y.Doc;
  name: string;
  _dbref: number;
  _dbsize: number;
  _destroyed: boolean;
  db: IDBDatabase | null;
  synced: boolean;
  _db: Promise<IDBDatabase>;
  whenSynced: Promise<IndexeddbPersistence>;
  _storeTimeout: number;
  _storeTimeoutId: NodeJS.Timeout | null;

  constructor(name: string, doc: Y.Doc) {
    super();
    this.doc = doc;
    this.name = name;
    this._dbref = 0;
    this._dbsize = 0;
    this._destroyed = false;
    this.db = null;
    this.synced = false;
    this._db = idb.openDB(name, (db) =>
      idb.createStores(db, [['updates', { autoIncrement: true }], ['custom']]),
    );
    this.whenSynced = promise.create((resolve) =>
      this.on('synced', () => resolve(this)),
    );

    this._db.then((db) => {
      this.db = db;
      const beforeApplyUpdatesCallback = (updatesStore: IDBObjectStore) =>
        idb.addAutoKey(updatesStore, Y.encodeStateAsUpdate(doc));
      const afterApplyUpdatesCallback = () => {
        if (this._destroyed) return this;
        this.synced = true;
        this.emit('synced', [this]);
      };
      fetchUpdates(this, beforeApplyUpdatesCallback, afterApplyUpdatesCallback);
    });
    this._storeTimeout = 1000;
    this._storeTimeoutId = null;
    this._storeUpdate = (update: Uint8Array, origin: any) => {
      if (this.db && origin !== this) {
        const [updatesStore] = idb.transact(this.db as IDBDatabase, [
          updatesStoreName,
        ]);
        idb.addAutoKey(updatesStore, update);
        if (++this._dbsize >= PREFERRED_TRIM_SIZE) {
          if (this._storeTimeoutId !== null) {
            clearTimeout(this._storeTimeoutId);
          }
          this._storeTimeoutId = setTimeout(() => {
            storeState(this, false);
            this._storeTimeoutId = null;
          }, this._storeTimeout);
        }
      }
    };
    doc.on('update', this._storeUpdate);
    this.destroy = this.destroy.bind(this);
    doc.on('destroy', this.destroy);
  }

  forcePersist(): void {
    storeState(this, true);
  }

  async destroy(): Promise<void> {
    if (this._storeTimeoutId) {
      clearTimeout(this._storeTimeoutId);
    }
    this.doc.off('update', this._storeUpdate);
    this.doc.off('destroy', this.destroy);
    this._destroyed = true;
    return this._db.then((db) => {
      db.close();
    });
  }

  async clearData(): Promise<void> {
    return this.destroy().then(() => {
      idb.deleteDB(this.name);
    });
  }

  async get(key: string | number | ArrayBuffer | Date): Promise<any> {
    return this._db.then((db) => {
      const [custom] = idb.transact(db, [customStoreName], 'readonly');
      return idb.get(custom, key);
    });
  }

  async set(
    key: string | number | ArrayBuffer | Date,
    value: any,
  ): Promise<any> {
    return this._db.then((db) => {
      const [custom] = idb.transact(db, [customStoreName]);
      return idb.put(custom, value, key);
    });
  }

  async del(key: string | number | ArrayBuffer | Date): Promise<void> {
    return this._db.then((db) => {
      const [custom] = idb.transact(db, [customStoreName]);
      return idb.del(custom, key);
    });
  }

  private _storeUpdate: (update: Uint8Array, origin: any) => void;
}
