import { ProgressEnum } from 'components/svg/PreviewCube';
import {
  Clue,
  CrosscubeType,
  CrossmojiData,
  GameState,
  PuzzleCell,
  PuzzleData,
  SolutionCell,
  SolutionCellNumber,
  SolutionCellValue,
} from '../../types/types';
import memoizeOne from 'memoize-one';
import { PuzzleType } from 'types/types';
import * as Y from 'yjs';

export const GAME_STATE_KEY = 'GAME_STATE_KEY';
export const CHARACTER_POSITIONS_KEY = 'characterPositions';
export const VALIDATIONS_KEY = 'validations';
export const DRAFT_MODES_KEY = 'draftModes';
export const TIME_KEY = 'time';
export const GUESSES_KEY = 'guesses';

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

export type SequenceKeys = 'across' | 'down';

export interface CharacterRecord {
  words: WordType[];
  wordSequences: SequenceType[];
  wordSequencesBySide: Record<
    number,
    {
      [K in SequenceKeys]: CharacterRecord['wordSequences'];
    }
  >;
  wordSequencesBySideFlat: Record<
    SequenceKeys,
    { side: number; index: number; sequence: number[] }[]
  >;
  solution: SolutionType[];
  clues: {
    across: Clue[];
    down: Clue[];
  };
}

type SequenceType = number[]; // grid coordinates for full word
type WordType = string[]; // the string value (answer) for the word

type SolutionType = {
  value: SolutionCell;
  mapping?: Record<
    number,
    {
      wordAcrossIndex?: number;
      wordDownIndex?: number;
      acrossSequenceIndex?: number;
      downSequenceIndex?: number;
    }
  >; // [side]: word indices
  x: number;
  y: number;
};

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

export const initializeAnswerIndex = (solution: SolutionType[]) => {
  // We initialize the array with the max safe integer
  // Each integer will map to the index of the character in the record solution
  // Since bitwise operations only work on 32 bit integers, we need to split the array into chunks of 32
  const answerIndex = Array.from(
    { length: Math.ceil(solution.length / 32) },
    () => Number.MAX_SAFE_INTEGER >>> 0,
  );

  for (const [index, { value: cell }] of solution.entries()) {
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
  solution: SolutionType[],
) => {
  try {
    if (
      characterPositionArray != null &&
      characterPositionArray.length >= solution.length * 2
    ) {
      // Update index based on character position array
      let index = 0;
      for (let x = 0; x < solution.length * 2; x += 2) {
        const { value: cell } = solution[index];
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
  } catch (error) {
    console.error(error);
  } finally {
    return answerIndex;
  }
};

export const resequenceSolutionAndClues = (
  puzzleData: PuzzleData[],
): {
  solution: SolutionCell[][];
  across: Clue[];
  down: Clue[];
} => {
  const { width, height } = puzzleData[0].dimensions;

  const original = puzzleData.map((p) => p.solution);
  // Make a copy of the original so we can mutate it
  const solution: SolutionCell[][][] = JSON.parse(JSON.stringify(original));
  const acrossClues = puzzleData.map((p) => p.clues.Across);
  const downClues = puzzleData.map((p) => p.clues.Down);

  // Here we concatenate all of the rows into one array per row
  const originalRowFirst: { cell: SolutionCell; side: number }[][] = [];
  for (let x = 0; x < height; x++) {
    for (let y = 0; y < solution.length; y++) {
      originalRowFirst[x] = (originalRowFirst[x] ?? []).concat(
        solution[y][x]
          .slice(0, solution[y][x].length - 1)
          .map((c: SolutionCell) => ({
            cell: c,
            side: y,
          })),
      );
    }
    // Nice debug output showing all of the rows
    // console.log(
    //   originalRowFirst[x]
    //     .map((i) => i.cell)
    //     .map((i) => (i !== '#' ? i.value : i)),
    // );
  }

  let ascending = 1;
  const across: Clue[] = [];
  const down: Clue[] = [];

  for (let x = 0; x < originalRowFirst.length; x++) {
    for (let y = 0; y < originalRowFirst[x].length; y++) {
      const current = originalRowFirst[x][y];
      if (current.cell != null && isCellWithNumber(current.cell)) {
        const acrossClue = acrossClues[current.side].find(
          (c) => current.cell !== '#' && c.number === current.cell.cell,
        );
        const downClue = downClues[current.side].find(
          (c) => current.cell !== '#' && c.number === current.cell.cell,
        );
        if (acrossClue != null) {
          across.push({
            ...acrossClue,
            number: ascending,
          });
        }
        if (downClue != null) {
          down.push({
            ...downClue,
            number: ascending,
          });
        }
        current.cell.cell = ascending++;
      }
    }
  }

  return {
    solution: originalRowFirst.map((i) => i.map((i) => i.cell)),
    across,
    down,
  };
};

export const getCharacterRecord = (
  puzzleData: PuzzleData[],
): CharacterRecord => {
  const { width, height } = puzzleData[0].dimensions;
  const words: CharacterRecord['words'] = [];
  const wordSequences: CharacterRecord['wordSequences'] = [];
  const wordSequencesBySide: CharacterRecord['wordSequencesBySide'] = {};
  const solution: Record<number, SolutionType> = {};

  const {
    solution: resequenced,
    across,
    down,
  } = resequenceSolutionAndClues(puzzleData);

  // This take the resequenced solution and adds the extra columns so we can more
  // easily determine the words and sequences
  const rowFirstOrderFlat = resequenced
    .map((i) =>
      i.reduce((acc, value, index) => {
        if (index === i.length - 1) {
          acc.push(value);
          acc.push(i[0]);
        } else if (index !== 0 && index % (width - 1) === 0) {
          acc.push(value);
          acc.push(value);
        } else {
          acc.push(value);
        }
        return acc;
      }, [] as SolutionCell[]),
    )
    .flatMap((i) => i);

  let currentWord = 0;
  // Build dictionary for words and word sequences [ACROSS]
  const rowLength = width * puzzleData.length;
  for (let x = 0; x < height; x++) {
    for (let y = 0; y < rowLength; y++) {
      // Math.floor(y / width) subtracts the extra columns from the running total (index)
      // so it matches the the rendered cross cube
      const side = Math.floor(y / width);
      const index = x * rowLength + y;
      const cell = rowFirstOrderFlat[index];
      let finalIndex = index - side;
      // The final column needs to start from the beginning
      if (y === rowLength - 1) {
        finalIndex = x * rowLength;
      }
      if (cell === '#' || y % width === 0) {
        currentWord++;
      }
      if (cell !== '#') {
        words[currentWord] = (words[currentWord] ?? '').concat(cell.value);
        wordSequences[currentWord] = (wordSequences[currentWord] ?? []).concat(
          finalIndex - x * puzzleData.length, // subtract the extra columns
        );

        if (wordSequencesBySide[side] == null) {
          wordSequencesBySide[side] = {
            across: [],
            down: [],
          };
        }
        wordSequencesBySide[side].across[currentWord] =
          wordSequences[currentWord];
      }

      solution[finalIndex] = {
        value: y === rowLength - 1 ? solution[finalIndex]?.value : cell,
        mapping:
          cell === '#'
            ? undefined
            : {
                ...solution[finalIndex]?.mapping,
                [side]: {
                  wordAcrossIndex: currentWord,
                  acrossSequenceIndex: currentWord,
                },
              },
        x: -1, // we will set this later
        y: x,
      };
    }
  }

  // Build dictionary for words and word sequences [DOWN]
  for (let x = 0; x < rowLength; x++) {
    // Math.floor(y / width) subtracts the doubled columns from the running total (index)
    // so it matches the the rendered cross cube
    const side = Math.floor(x / width);
    for (let y = 0; y < height; y++) {
      const index = x + rowLength * y;
      const cell = rowFirstOrderFlat[index];
      let finalIndex = index - side;
      // The final column needs to start from the beginning
      if (x === rowLength - 1) {
        finalIndex = y * rowLength;
      }
      if (cell === '#' || y % height === 0) {
        currentWord++;
      }
      if (cell !== '#') {
        words[currentWord] = (words[currentWord] ?? '').concat(cell.value);
        wordSequences[currentWord] = (wordSequences[currentWord] ?? []).concat(
          finalIndex - y * puzzleData.length, // subtract the extra columns
        );

        if (wordSequencesBySide[side] == null) {
          wordSequencesBySide[side] = {
            across: [],
            down: [],
          };
        }
        wordSequencesBySide[side].down[currentWord] =
          wordSequences[currentWord];
      }

      solution[finalIndex] = {
        ...solution[finalIndex],
        mapping:
          cell === '#'
            ? undefined
            : {
                ...solution[finalIndex]?.mapping,
                [side]: {
                  ...solution[finalIndex]?.mapping?.[side],
                  wordDownIndex: currentWord,
                  downSequenceIndex: currentWord,
                },
              },
      };
    }
  }

  const solutionArray = Object.values(solution);

  // Set x coordinates
  // This is so much easier after creating the final solution
  for (let x = 0; x < solutionArray.length; x++) {
    solutionArray[x].x = x % (width - 1);
  }

  const wordSequencesBySideFlat: Record<
    SequenceKeys,
    { side: number; index: number; sequence: number[] }[]
  > = {
    across: [],
    down: [],
  };
  for (const [key, value] of Object.entries(wordSequencesBySide)) {
    wordSequencesBySideFlat['across'] = wordSequencesBySideFlat[
      'across'
    ].concat(
      Object.entries(value['across']).map(([index, sequence]) => ({
        side: parseInt(key, 10),
        index: parseInt(index, 10),
        sequence,
      })),
    );
    wordSequencesBySideFlat['down'] = wordSequencesBySideFlat['down'].concat(
      Object.entries(value['down']).map(([index, sequence]) => ({
        side: parseInt(key, 10),
        index: parseInt(index, 10),
        sequence,
      })),
    );
  }

  return {
    words,
    wordSequences,
    wordSequencesBySide,
    wordSequencesBySideFlat,
    solution: solutionArray,
    clues: {
      across,
      down,
    },
  };
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

  let attempted = 0;
  let total = 0;
  for (let x = 0; x < puzzle.record.solution.length; x++) {
    const { value: cell } = puzzle.record.solution[x];
    if (cell !== '#') {
      if (
        characterPositions[x * 2] !== -1 &&
        characterPositions[x * 2 + 1] !== -1
      ) {
        attempted++;
      }
      total++;
    }
  }

  const percentage = attempted / total;

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
  guesses: -1,
  characterPositions: createFloat32Array(puzzle),
  validations: createInt16Array(puzzle),
  draftModes: createInt16Array(puzzle),
  answerIndex: initializeAnswerIndex(puzzle.record.solution),
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
  doc.getMap(GAME_STATE_KEY).set(GUESSES_KEY, -1);

  return doc;
};

function roundUpToNearestFive(num: number): number {
  return Math.ceil(num / 5) * 5;
}

export type PuzzleStats = {
  time: number;
  timeSuccess: boolean;
  goalTime: number;
  guesses: number;
  guessSuccess: boolean;
  goalGuesses: number;
  hintSuccess: boolean;
};

const baseLength = 3;

export const getPuzzleStats = (
  puzzle: PuzzleType,
  time?: number,
  guesses?: number,
  validations?: Int16Array,
): PuzzleStats => {
  const { width, height } = puzzle.data[0].dimensions;
  const gridSize = width * height;
  // Crossmoji has no down clues and is 3x3 (9)
  const numberOfWords =
    puzzle.record.clues.across.length +
    (gridSize === 9 ? 0 : puzzle.record.clues.down.length);

  let avgWordLength = 1; // crossmojis are always one long
  if (gridSize > 9) {
    const uniqueWords = new Set(puzzle.record.words);
    avgWordLength =
      uniqueWords.size > 0
        ? Array.from(uniqueWords).reduce((acc, word) => {
            return word != null ? word.length + acc : acc;
          }, 0) / uniqueWords.size
        : 1;
  }
  // For every word length over 3, we add 10% to the goal time
  let scalingFactor = 1 + Math.max(0, (avgWordLength - baseLength) * 0.1);
  // Base is 20 seconds per word times a scaling factor
  const goalTime = roundUpToNearestFive(numberOfWords * 20 * scalingFactor);

  const scalePerChar = 0.15; // 15% increase per character above base length
  const guessScalingFactor =
    1 + Math.max(0, (avgWordLength - baseLength) * scalePerChar);

  const baseGuessesPerWord = 0.25;
  const goalGuesses = Math.max(
    1,
    Math.ceil(numberOfWords * baseGuessesPerWord * guessScalingFactor),
  );

  return {
    hintSuccess: !validations?.some((v) => v !== 0),
    timeSuccess: (time ?? 0) <= goalTime,
    goalTime,
    guessSuccess: (guesses ?? 0) <= goalGuesses,
    goalGuesses,
    time: time ?? 0,
    guesses: guesses ?? 0,
  };
};

const CROSSMOJI_LABEL = ['crossmoji'];
const MINI_LABEL = ['crosscube', 'mini'];
const MEGA_LABEL = ['crosscube', 'mega'];
const CROSSCUBE_LABEL = ['crosscube'];

export const getPuzzleLabelForType = (type: CrosscubeType): string[] => {
  switch (type) {
    case 'moji':
      return CROSSMOJI_LABEL;
    case 'mini':
      return MINI_LABEL;
    case 'mega':
      return MEGA_LABEL;
    default:
      return CROSSCUBE_LABEL;
  }
};

export const getPuzzleLabel = (puzzle: PuzzleType): string[] => {
  const { width, height } = puzzle.data[0].dimensions;
  const size = width * height;
  switch (size) {
    case 9:
      return CROSSMOJI_LABEL;
    case 25:
      return MINI_LABEL;
    case 144:
      return MEGA_LABEL;
    default:
      return CROSSCUBE_LABEL;
  }
};

export const getIconForType = (type: CrosscubeType) => {
  switch (type) {
    case 'moji':
      return '/moji_icon.png';
    case 'mini':
      return '/mini_icon.png';
    case 'cube':
      return '/crosscube_icon.png';
    case 'mega':
      return '/mega_icon.png';
    default:
      return '/general_icon.png';
  }
};

export const getAltForType = (type: CrosscubeType) => {
  switch (type) {
    case 'moji':
      return 'Answer a three-dimensioanl crossword puzzle with emojis. Ready?';
    case 'mini':
      return 'A quick 4-part puzzler in three dimensions. Ready?';
    case 'cube':
      return 'A challenging 8x8 crossword puzzle in three dimensions. Ready?';
    case 'mega':
      return 'A monster 12x12 crossword puzzle in three dimensions. Ready?';
    default:
      return 'A crossword puzzle in three dimensions. Ready?';
  }
};

export const getTypeForSize = (puzzle: PuzzleType): CrosscubeType => {
  const { width, height } = puzzle.data[0].dimensions;
  const size = width * height;
  switch (size) {
    case 9:
      return 'moji';
    case 25:
      return 'mini';
    case 144:
      return 'mega';
    default:
      return 'cube';
  }
};

export const createBlankPuzzleData = (
  width: number,
  height: number,
): PuzzleData => ({
  dimensions: {
    width,
    height,
  },
  puzzle: Array.from({ length: height }, () =>
    Array.from({ length: width }, () => '#'),
  ),
  solution: Array.from({ length: height }, () =>
    Array.from({ length: width }, () => '#'),
  ),
  clues: {
    Across: [],
    Down: [],
  },
});

export function emojiToUnicode(emoji: string): string {
  const codePoints = Array.from(emoji).map(
    (char) => char.codePointAt(0)?.toString(16).padStart(4, '0') || '',
  );

  return 'u' + codePoints.join('_');
}

export const convertCrossmojiData = (data: CrossmojiData): PuzzleData[] => {
  const width = data.grid[0].length;
  const height = data.grid.length;

  const entries = Object.entries(data.entries);
  const keys = Object.keys(data.entries);

  const secondSidePuzzleData = createBlankPuzzleData(width, height);
  const fourthSidePuzzleData = createBlankPuzzleData(width, height);

  let total = 0;
  const puzzle: PuzzleCell[][] = [];
  const solution: SolutionCell[][] = [];
  data.grid.forEach((row, x) =>
    row.map((cell, y) => {
      if (puzzle[x] == null) {
        puzzle[x] = [];
      }
      if (solution[x] == null) {
        solution[x] = [];
      }
      if (cell === 1) {
        total++;
        puzzle[x].push(total);
        const emoji = keys[y * row.length + x];
        const value = {
          value: emojiToUnicode(emoji),
          cell: total,
        };
        solution[x].push(value);
        // Store the last column values in the solution
        if (y === row.length - 1) {
          secondSidePuzzleData.puzzle[x][0] = total;
          secondSidePuzzleData.solution[x][0] = value;
        }
        if (y === 0) {
          fourthSidePuzzleData.puzzle[x][row.length - 1] = total;
          fourthSidePuzzleData.solution[x][row.length - 1] = value;
        }
      } else {
        puzzle[x].push('#');
        solution[x].push('#');
        // Store the last column values in the solution
        if (y === row.length - 1) {
          secondSidePuzzleData.puzzle[x][0] = '#';
          secondSidePuzzleData.solution[x][0] = '#';
        }
        if (y === 0) {
          fourthSidePuzzleData.puzzle[x][row.length - 1] = '#';
          fourthSidePuzzleData.solution[x][row.length - 1] = '#';
        }
      }
    }),
  );

  // Convert CrossmojiData to PuzzleData
  const puzzleData: PuzzleData = {
    dimensions: {
      width,
      height,
    },
    puzzle,
    solution,
    clues: {
      Across: [],
      Down: [],
    },
  };

  // Generate clues
  let clueNumber = 1;
  entries.forEach(([emoji, clue]) => {
    if (clue) {
      puzzleData.clues.Across.push({
        number: clueNumber,
        clue: clue,
        answer: emojiToUnicode(emoji),
      });
      clueNumber++;
    }
  });

  secondSidePuzzleData.clues.Across = puzzleData.clues.Across;
  fourthSidePuzzleData.clues.Across = puzzleData.clues.Across;

  // Convert PuzzleData to CharacterRecord
  return [
    puzzleData,
    secondSidePuzzleData,
    createBlankPuzzleData(width, height),
    fourthSidePuzzleData,
  ];
};
