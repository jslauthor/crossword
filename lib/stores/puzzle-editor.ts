import { createStore } from 'zustand/vanilla';
import * as Y from 'yjs';
import { PuzzleType } from 'types/types';
import { createFloat32Array } from 'lib/utils/puzzle';

export const GAME_STATE_KEY = 'GAME_STATE_KEY';
export const CHARACTER_POSITIONS_KEY = 'characterPositions';

export type PuzzleLayout = 'default' | 'emoji';
export type PuzzleDimensionType = '2d' | '3d';
export type PuzzleSizeType = 3 | 4 | 5 | 6 | 7 | 8;

export type PuzzleEditorState = {
  title: string | undefined;
  style: PuzzleLayout;
  type: PuzzleDimensionType;
  size: PuzzleSizeType;
  showSettings: boolean;
  characterPositions: Float32Array;
  // Empty Map to hold all 26 keys and their corresponding emojis
  keyMap: Map<number, [string, string]>;
};

function generateKeyMap(): Map<number, [string, string]> {
  const map = new Map<number, [string, string]>();
  for (let i = 0; i < 26; i++) {
    map.set(i, ['', '']);
  }
  return map;
}

export type PuzzleEditorActions = {
  updateTitle: (title: string | undefined) => void;
  updateStyle: (style: PuzzleLayout) => void;
  updateType: (type: PuzzleDimensionType) => void;
  updateSize: (size: PuzzleSizeType) => void;
  toggleSettings: (val: boolean) => void;
  initializeCharacterPositions: (puzzle: PuzzleType) => void;
  updateCharacterPosition: (
    selectedIndex: number,
    key: string,
    x: number,
    y: number,
  ) => boolean;
};

export type PuzzleEditorStore = PuzzleEditorState & PuzzleEditorActions;

export const createPuzzleEditorStore = (
  initialState: PuzzleEditorState = {
    title: undefined,
    style: 'emoji',
    type: '2d',
    size: 5,
    showSettings: false,
    keyMap: generateKeyMap(),
    characterPositions: new Float32Array(),
  },
) => {
  const puzzleState = new Y.Doc();

  const store = createStore<PuzzleEditorStore>((set, get) => ({
    ...initialState,
    initializeCharacterPositions: (puzzle: PuzzleType) => {
      const positions = createFloat32Array(puzzle);
      puzzleState
        .getMap(GAME_STATE_KEY)
        .set(CHARACTER_POSITIONS_KEY, Y.Array.from(Array.from(positions)));
    },
    updateTitle: (title) => set({ title }),
    updateStyle: (style) => set({ style }),
    updateType: (type) => set({ type }),
    updateSize: (size) => set({ size }),
    toggleSettings: (val: boolean) => set({ showSettings: val }),
    updateCharacterPosition: (
      selectedIndex: number,
      key: string,
      x: number,
      y: number,
    ) => {
      const characterPositions = get().characterPositions;
      const newArray = new Float32Array([...characterPositions]);
      newArray[selectedIndex * 2] = x;
      newArray[selectedIndex * 2 + 1] = y;
      puzzleState
        .getMap(GAME_STATE_KEY)
        .set(
          CHARACTER_POSITIONS_KEY,
          Y.Array.from(Array.from(characterPositions)),
        );
      return true;
    },
  }));

  puzzleState.getMap(GAME_STATE_KEY).observe((event: Y.YMapEvent<unknown>) => {
    event.keysChanged.forEach((key) => {
      if (key === CHARACTER_POSITIONS_KEY) {
        const positions = new Float32Array(
          event.target.get(CHARACTER_POSITIONS_KEY) as number[],
        );
        store.setState({ characterPositions: positions });
      }
    });
  });

  return store;
};
