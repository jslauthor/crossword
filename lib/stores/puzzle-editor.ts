import { createStore } from 'zustand/vanilla';

export type PuzzleLayout = 'default' | 'emoji';
export type PuzzleDimensionType = '2d' | '3d';
export type PuzzleSizeType = 3 | 4 | 5 | 6 | 7 | 8;

export type PuzzleEditorState = {
  title: string | undefined;
  style: PuzzleLayout;
  type: PuzzleDimensionType;
  size: PuzzleSizeType;
  showSettings: boolean;
};

export type PuzzleEditorActions = {
  updateTitle: (title: string | undefined) => void;
  updateStyle: (style: PuzzleLayout) => void;
  updateType: (type: PuzzleDimensionType) => void;
  updateSize: (size: PuzzleSizeType) => void;
  toggleSettings: (val: boolean) => void;
};

export type PuzzleEditorStore = PuzzleEditorState & PuzzleEditorActions;

export const createPuzzleEditorStore = (
  initialState: PuzzleEditorState = {
    title: undefined,
    style: 'default',
    type: '2d',
    size: 5,
    showSettings: false,
  },
) => {
  return createStore<PuzzleEditorStore>((set) => ({
    ...initialState,
    updateTitle: (title) => set({ title }),
    updateStyle: (style) => set({ style }),
    updateType: (type) => set({ type }),
    updateSize: (size) => set({ size }),
    toggleSettings: (val: boolean) => set({ showSettings: val }),
  }));
};
