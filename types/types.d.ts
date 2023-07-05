import { Object3DNode, MaterialNode } from '@react-three/fiber';

export type BlankCell = '#';

export type StandardCell = number | ':';
export type SolutionCellValue = {
  value: string;
  cell: StandardCell;
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
  answer: string;
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

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: Object3DNode<MeshLineGeometry, typeof MeshLineGeometry>;
    meshLineMaterial: MaterialNode<MeshLineMaterial, typeof MeshLineMaterial>;
  }
}
