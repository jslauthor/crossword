export type BlankCell = '#';

export type StandardCell = number | ':';

export type SolutionCell =
  | BlankCell
  | {
      value: string;
      cell: StandardCell;
    };

export type PuzzleCell =
  | BlankCell
  | StandardCell
  | {
      cell: StandardCell | BlankCell;
      style: { barred: 'L' | 'T' | 'R' | 'B' };
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
}
