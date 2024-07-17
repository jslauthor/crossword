import { PrismaClient } from '@prisma/client';
import { Object3DNode, MaterialNode } from '@react-three/fiber';
import { PuzzlePreviewProps } from 'components/composed/PuzzlePreview';
import { CharacterRecord, CrosscubeType } from 'lib/utils/puzzle';

declare global {
  var prisma: PrismaClient;
}

export type GameState = {
  time: number;
  characterPositions: Float32Array;
  validations: Int16Array;
  draftModes: Int16Array;
  answerIndex: number[];
  guesses: number; // anytime they input a letter, increment this. do not increment for backspace
};

export type BlankCell = '#';

export type StandardCell = number | ':';
export type SolutionCellValue = {
  value: string;
  cell: StandardCell;
};
export type SolutionCellNumber = {
  value: string;
  cell: number;
};

export type SolutionCell = BlankCell | SolutionCellValue;

export type PuzzleCell =
  | BlankCell
  | StandardCell
  | {
      cell: StandardCell | BlankCell;
      style: { barred: 'L' | 'T' | 'R' | 'B' };
    };

export type Clue = {
  answer?: string;
  number: number;
  clue: string;
};

export interface PuzzleData {
  author: string;
  copyright: string;
  dimensions: {
    width: number;
    height: number;
  };
  puzzle: PuzzleCell[][];
  solution: SolutionCell[][];
  clues: {
    Across: Clue[];
    Down: Clue[];
  };
}

export interface SvgProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: Object3DNode<MeshLineGeometry, typeof MeshLineGeometry>;
    meshLineMaterial: MaterialNode<MeshLineMaterial, typeof MeshLineMaterial>;
  }
}

export type PuzzleType = Omit<
  PuzzlePreviewProps,
  'dimensions' | 'puzzleLabel' | 'type'
> & {
  slug: string;
  id: string;
  data: PuzzleData[];
  svgSegments?: string[];
  record: CharacterRecord;
  previewState: number;
};

export type CrosscubeType = 'moji' | 'mini' | 'cube' | 'mega';
export const crosscubeTypes = ['cube', 'mega', 'mini', 'moji'] as const;
type CheckAllUnions = {
  [K in CrosscubeType]: K extends (typeof crosscubeTypes)[number]
    ? true
    : false;
};
type AllUnionsPresent = CheckAllUnions[CrosscubeType] extends true
  ? true
  : false;
export type ValidCrosscubeArray = AllUnionsPresent extends true
  ? typeof crosscubeTypes
  : never;

export interface DebouncedFunc<T extends (...args: any[]) => any> {
  /**
   * Call the original function, but applying the debounce rules.
   *
   * If the debounced function can be run immediately, this calls it and returns its return
   * value.
   *
   * Otherwise, it returns the return value of the last invocation, or undefined if the debounced
   * function was not invoked yet.
   */
  (...args: Parameters<T>): ReturnType<T> | undefined;

  /**
   * Throw away any pending invocation of the debounced function.
   */
  cancel(): void;

  /**
   * If there is a pending invocation of the debounced function, invoke it immediately and return
   * its return value.
   *
   * Otherwise, return the value from the last invocation, or undefined if the debounced function
   * was never invoked.
   */
  flush(): ReturnType<T> | undefined;
}
