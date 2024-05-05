import { ProgressEnum } from 'components/svg/PreviewCube';
import {
  Clue,
  GameState,
  PuzzleData,
  SolutionCell,
  SolutionCellNumber,
  SolutionCellValue,
} from '../../types/types';
import memoizeOne from 'memoize-one';
import { PuzzleType } from 'app/page';
import * as Y from 'yjs';

export const GAME_STATE_KEY = 'GAME_STATE_KEY';
export const CHARACTER_POSITIONS_KEY = 'characterPositions';
export const VALIDATIONS_KEY = 'validations';
export const DRAFT_MODES_KEY = 'draftModes';
export const TIME_KEY = 'time';

export function isSolutionCellValue(
  cell: SolutionCell,
): cell is SolutionCellValue {
  return (cell as SolutionCellValue).value !== undefined;
}

export function isCellWithNumber(
  cell: SolutionCell,
): cell is SolutionCellNumber {
  return (
    isSolutionCellValue(cell) && typeof cell.cell === 'number' && cell.cell > 0
  );
}

export interface CharacterRecord {
  solution: SolutionCell[];
  clues: {
    across: Clue[];
    down: Clue[];
  };
}

// Invert the dictionary for faster lookups
export const invertAtlas = memoizeOne(
  (atlas: Record<string, [number, number]>) => {
    const inverted: Record<string, string> = {};
    for (const [key, value] of Object.entries(atlas)) {
      inverted[value.join(',')] = key;
    }
    return inverted;
  },
);

export const initializeAnswerIndex = (solution: SolutionCell[]) => {
  // We initialize the array with the max safe integer
  // Each integer will map to the index of the character in the record solution
  // Since bitwise operations only work on 32 bit integers, we need to split the array into chunks of 32
  const answerIndex = Array.from(
    { length: Math.ceil(solution.length / 32) },
    () => Number.MAX_SAFE_INTEGER >>> 0,
  );

  for (const [index, cell] of solution.entries()) {
    if (cell !== '#') {
      const chunk = Math.floor(index / 32);
      const bit = index % 32;
      answerIndex[chunk] &= ~(1 << bit);
    }
  }

  return answerIndex;
};

// This mutates the answerIndex
export const updateAnswerIndex = (
  answerIndex: number[],
  atlas: Record<string, string>,
  characterPositionArray: Float32Array | undefined,
  solution: SolutionCell[],
) => {
  if (characterPositionArray != null && characterPositionArray.length > 0) {
    // Update index based on character position array
    let index = 0;
    for (let x = 0; x < characterPositionArray.length; x += 2) {
      const cell = solution[index];
      if (cell && cell != '#') {
        const chunk = Math.floor(index / 32);
        const bit = index % 32;
        const characterPosition = characterPositionArray.slice(x, x + 2);
        const character = atlas[characterPosition.join(',')];
        if (character != null) {
          const isCorrect =
            cell.value.toUpperCase() === character.toUpperCase();
          if (isCorrect) {
            // This flips the index bit to 1 (true)
            answerIndex[chunk] |= 1 << bit;
          } else {
            // This flips the index bit to 0 (false)
            answerIndex[chunk] &= ~(1 << bit);
          }
        }
      }
      index++;
    }
  }

  return answerIndex;
};

/**
 * This takes an array of puzzle data and returns a single puzzle
 * data object with the solution and clues merged together.
 *
 * @param puzzleData
 */
export const getCharacterRecord = (
  puzzleData: PuzzleData[],
): {
  solution: SolutionCell[];
  clues: {
    across: (Clue & { originalNumber: number; side: number })[];
    down: (Clue & { originalNumber: number; side: number })[];
  };
} => {
  let runningTotal = 0;
  // We need to store the columns we hide so we can grab
  // their cell numbers and add them back in
  const hiddenColumns: SolutionCell[][] = [];
  const data = puzzleData.reduce<{
    solution: SolutionCell[];
    clues: {
      across: (Clue & { originalNumber: number; side: number })[];
      down: (Clue & { originalNumber: number; side: number })[];
    };
  }>(
    (value, { solution, dimensions, clues }, index) => {
      const { width } = dimensions;
      const flattened = solution.flatMap((s) => s);
      if (Array.isArray(hiddenColumns[index]) === false) {
        hiddenColumns[index] = [];
      }
      let highest: number = 0;

      for (let x = 0; x < flattened.length; x++) {
        const currentCell = flattened[x];
        const isCell = isCellWithNumber(currentCell);

        if (x % width === 0) {
          // first column
          // we skip the first column since the last column
          // in the following grid is the same
          value.solution.push('#');
          hiddenColumns[index].push(
            isCell
              ? {
                  cell: currentCell.cell + runningTotal,
                  value: currentCell.value,
                }
              : '#',
          );
          if (isCell) {
            const a = clues.Across.find((c) => c.number === currentCell.cell);
            const c = clues.Down.find((c) => c.number === currentCell.cell);
            if (a) {
              value.clues.across.push({
                ...a,
                number: a.number + runningTotal,
                originalNumber: a.number,
                side: index,
              });
            }
            if (c) {
              value.clues.down.push({
                ...c,
                number: c.number + runningTotal,
                originalNumber: c.number,
                side: index,
              });
            }
          }
        } else {
          if (isCell) {
            value.solution.push({
              cell: currentCell.cell + runningTotal,
              value: currentCell.value,
            });
            // skip the last column
            if (x % width !== width - 1) {
              const a = clues.Across.find((c) => c.number === currentCell.cell);
              const c = clues.Down.find((c) => c.number === currentCell.cell);
              if (a) {
                value.clues.across.push({
                  ...a,
                  number: a.number + runningTotal,
                  originalNumber: a.number,
                  side: index,
                });
              }
              if (c) {
                value.clues.down.push({
                  ...c,
                  number: c.number + runningTotal,
                  originalNumber: c.number,
                  side: index,
                });
              }
            }
          } else {
            value.solution.push(currentCell);
          }
        }
        if (isCell) {
          highest = currentCell.cell > highest ? currentCell.cell : highest;
        }
      }
      runningTotal = runningTotal + highest;
      return value;
    },
    {
      solution: [],
      clues: {
        across: [],
        down: [],
      },
    },
  );

  let index = 0;
  const width = puzzleData[0].dimensions.width;
  const totalPerSide = puzzleData[0].dimensions.height * width;

  // Make the first element the last to match the solution
  const firstColumn = hiddenColumns.shift();
  if (firstColumn != null) {
    hiddenColumns.push(firstColumn);
  }

  for (let j = width; j <= data.solution.length; j += width) {
    const side = Math.ceil(j / totalPerSide) - 1;
    data.solution[j - 1] = hiddenColumns[side][index % width];
    index++;
  }

  return data;
};

/**
 *
 * Just be sure you set blank cells to MAX_SAFE_INTEGER
 *
 * @param answerIndex
 * @returns boolean
 */
export const verifyAnswerIndex = (answerIndex: number[] = []): boolean =>
  answerIndex.length > 0 &&
  answerIndex.every((i) => i >>> 0 === Number.MAX_SAFE_INTEGER >>> 0);

/**
 * This looks at how much the user has filled in and returns a ProgressEnum.
 *
 * @param puzzleData
 * @param characterPositions
 * @returns ProgressEnum
 */
export const getProgressFromSolution = (
  puzzle: PuzzleType,
  characterPositions: GameState['characterPositions'],
  answerIndex: GameState['answerIndex'],
): ProgressEnum => {
  if (verifyAnswerIndex(answerIndex) === true) {
    return 3; // Solved
  }

  const puzzleSize = puzzle.record.solution.filter((v) => v !== '#').length;
  const completedSize =
    Object.values(characterPositions).filter((v) => v > -1).length / 2;
  const percentage = completedSize / puzzleSize;

  if (percentage <= 0.01) {
    return 0;
  } else if (percentage <= 0.5) {
    return 1;
  }

  return 2;
};
export const createFloat32Array = (puzzle: PuzzleType) =>
  Float32Array.from(createInitialArray(puzzle));

export const createInt16Array = (puzzle: PuzzleType) =>
  Int16Array.from(createInitialArray(puzzle, 0));

export const createInitialArray = (puzzle: PuzzleType, fill: number = -1) =>
  new Array(puzzle.record.solution.length * 2).fill(fill);

export const createInitialState = (puzzle: PuzzleType): GameState => ({
  time: 0,
  characterPositions: createFloat32Array(puzzle),
  validations: createInt16Array(puzzle),
  draftModes: createInt16Array(puzzle),
  answerIndex: initializeAnswerIndex(puzzle.record.solution),
  usedHint: false,
});

export const createInitialYDoc = (puzzle: PuzzleType): Y.Doc => {
  const doc = new Y.Doc();

  doc
    .getMap(GAME_STATE_KEY)
    .set(
      CHARACTER_POSITIONS_KEY,
      Y.Array.from(Array.from(createFloat32Array(puzzle))),
    );
  doc
    .getMap(GAME_STATE_KEY)
    .set(VALIDATIONS_KEY, Y.Array.from(Array.from(createInt16Array(puzzle))));
  doc
    .getMap(GAME_STATE_KEY)
    .set(DRAFT_MODES_KEY, Y.Array.from(Array.from(createInt16Array(puzzle))));
  doc.getMap(GAME_STATE_KEY).set(TIME_KEY, 0);

  return doc;
};

export const getAnswers = (puzzleData: PuzzleData[]) => {
  const { clues } = getCharacterRecord(puzzleData);

  const { width } = puzzleData[0].dimensions;
  const flattened = puzzleData.flatMap((p) => p.solution);

  // Across
  const across: Record<number, string> = {};

  for (let x = 0; x < flattened.length; x++) {
    const current = flattened[x];
    const side = Math.floor(x / width);
    let cellNumber: number | undefined = undefined;

    for (let y = 0; y < width; y++) {
      const cell = current[y];
      if (cellNumber === undefined && isCellWithNumber(cell)) {
        cellNumber = clues.across.find(
          (c) => c.originalNumber === cell.cell && side === c.side,
        )?.number;
      }
      if (cell === '#') {
        cellNumber = undefined;
        continue;
      }
      if (cellNumber !== undefined) {
        across[cellNumber] = (across[cellNumber] ?? '').concat(cell.value);
      }
    }
  }

  // Down
  const down: Record<number, string> = {};

  for (let x = 0; x < puzzleData.length; x++) {
    // Get the first row of each side
    const index = Math.floor(x * width);

    // Loop through the first row of the each side
    for (let y = 0; y < width; y++) {
      let cellNumber: number | undefined = undefined;
      for (let i = 0; i < width; i++) {
        // We break when we are on the last column of the last side
        // since that's the first column of the first side
        if (y === width - 1) {
          break;
        }

        const cell = flattened[index + i][y];
        if (cellNumber === undefined && isCellWithNumber(cell)) {
          cellNumber = clues.down.find(
            (c) => c.originalNumber === cell.cell && x === c.side,
          )?.number;
        }
        if (cell === '#') {
          cellNumber = undefined;
          continue;
        }
        if (cellNumber !== undefined) {
          down[cellNumber] = (down[cellNumber] ?? '').concat(cell.value);
        }
      }
    }
  }
};
