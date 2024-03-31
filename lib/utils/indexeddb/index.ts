'use client';

export const doesDatabaseExist = async (name: string) => {
  return (
    !window ||
    !window.indexedDB ||
    (await window.indexedDB.databases()).map((db) => db.name).includes(name)
  );
};
