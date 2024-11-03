'use client';

import { type ReactNode, createContext, useContext, useState } from 'react';
import {
  PuzzleEditorState,
  PuzzleEditorStore,
  createPuzzleEditorStore,
} from 'lib/stores/puzzle-editor';
import { useStore } from 'zustand';

export type PuzzleEditorStoreApi = ReturnType<typeof createPuzzleEditorStore>;

export const PuzzleEditorStoreContext = createContext<
  PuzzleEditorStoreApi | undefined
>(undefined);

export interface PuzzleEditorStoreProviderProps {
  initialState?: PuzzleEditorState;
  children: ReactNode;
}

export const PuzzleEditorStoreProvider = ({
  initialState,
  children,
}: PuzzleEditorStoreProviderProps) => {
  const [store] = useState(() => createPuzzleEditorStore(initialState));
  return (
    <PuzzleEditorStoreContext.Provider value={store}>
      {children}
    </PuzzleEditorStoreContext.Provider>
  );
};

export const usePuzzleEditorStore = <T,>(
  selector: (store: PuzzleEditorStore) => T,
): T => {
  const puzzleEditorContext = useContext(PuzzleEditorStoreContext);

  if (!puzzleEditorContext) {
    throw new Error(
      `usePuzzleEditorStore must be used within PuzzleEditorStoreProvider`,
    );
  }

  return useStore(puzzleEditorContext, selector);
};
