import { ProgressEnum } from 'components/svg/PreviewCube';
import {
  CellStyle,
  Clue,
  CrosscubeType,
  CrossmojiData,
  CrossmojiDataV2,
  GameState,
  PuzzleCell,
  PuzzleCellWithStyle,
  PuzzleData,
  SolutionCell,
  SolutionCellNumber,
  SolutionCellValue,
} from '../../types/types';
import memoizeOne from 'memoize-one';
import { PuzzleType } from 'types/types';
import * as Y from 'yjs';
import { constrain } from './math';

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

export function isCellWithStyle(cell: PuzzleCell): cell is PuzzleCellWithStyle {
  return typeof cell === 'object' && 'style' in cell;
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
  style?: CellStyle;
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
  solution: { cell: SolutionCell; style?: CellStyle }[][];
  across: Clue[];
  down: Clue[];
} => {
  const { height } = puzzleData[0].dimensions;

  const original = puzzleData.map((p) => p.solution);
  const puzzle = puzzleData.map((p) => p.puzzle);
  // Make a copy of the original so we can mutate it
  const solution: SolutionCell[][][] = JSON.parse(JSON.stringify(original));
  const acrossClues = puzzleData.map((p) => p.clues.Across);
  const downClues = puzzleData.map((p) => p.clues.Down);

  // Here we concatenate all of the rows into one array per row
  const originalRowFirst: {
    cell: SolutionCell;
    side: number;
    style?: CellStyle;
  }[][] = [];
  for (let x = 0; x < height; x++) {
    for (let y = 0; y < solution.length; y++) {
      originalRowFirst[x] = (originalRowFirst[x] ?? []).concat(
        solution[y][x]
          .slice(0, solution[y][x].length - 1)
          .map((c: SolutionCell, index: number) => {
            let style: CellStyle | undefined =
              isCellWithStyle(puzzle[y][x][index]) === true
                ? (puzzle[y][x][index] as PuzzleCellWithStyle).style
                : undefined;

            // If the correlative cell from the other side has a style, use it if the current cell does not
            if (index === 0 && style == null) {
              const prevSideIndex = constrain(0, puzzle.length - 1, y - 1);
              const prevSide = puzzle[prevSideIndex][x];
              const lastCellPrevSide = prevSide[prevSide.length - 1];
              if (isCellWithStyle(lastCellPrevSide) === true) {
                style = (lastCellPrevSide as PuzzleCellWithStyle).style;
              }
            }

            return {
              cell: c,
              side: y,
              style,
            };
          }),
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
    solution: originalRowFirst.map((i) =>
      i.map((i) => ({ cell: i.cell, style: i.style })),
    ),
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
      i.reduce(
        (acc, value, index) => {
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
        },
        [] as { cell: SolutionCell; style?: CellStyle }[],
      ),
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
      const { cell, style } = rowFirstOrderFlat[index];
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
        style,
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
      const { cell, style } = rowFirstOrderFlat[index];
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
        style: style ?? solution[finalIndex]?.style,
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
  if (puzzle.type != null) {
    return getPuzzleLabelForType(puzzle.type);
  }

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

export const getType = (puzzle: PuzzleType): CrosscubeType => {
  if (puzzle.type != null) {
    return puzzle.type;
  }

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
  clues?: PuzzleData['clues'],
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
  clues: clues ?? {
    Across: [],
    Down: [],
  },
});

// Function to convert Unicode string to emoji
export function unicodeToEmoji(unicode: string) {
  return String.fromCodePoint(
    ...unicode.split('_').map((u) => parseInt(u, 16)),
  );
}

export function emojiToUnicode(emoji: string): string {
  // If the emoji is already a unicode, return it
  if (emoji.charAt(0).toLowerCase() === 'u') {
    return emoji;
  }

  const codePoints = Array.from(emoji).map(
    (char) => char.codePointAt(0)?.toString(16).padStart(4, '0') || '',
  );

  return 'u' + codePoints.join('_');
}

// PLEASE NEVER CHANGE THE SEED LEST IT WILL BREAK ALL OF THE PUZZLES
type Entry = [string, string | null];
function deterministicSort(entries: Entry[], seed: number): Entry[] {
  // Create a seeded random number generator
  const seededRandom = (index: number): number => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  // Create an array of indices, sort it based on the seeded random values
  const sortedIndices = [...entries.keys()].sort(
    (a, b) => seededRandom(a) - seededRandom(b),
  );

  // Use the sorted indices to create a new array of entries in the determined order
  return sortedIndices.map((index) => entries[index]);
}

export const convertSimpleCrossmojiData = (
  data: CrossmojiData,
): PuzzleData[] => {
  const width = data.grid[0].length;
  const height = data.grid.length;

  if (data.seed == null) {
    throw new Error('Seed is required!');
  }

  const items = deterministicSort(Object.entries(data.items), data.seed);
  const secondSidePuzzleData = createBlankPuzzleData(width, height);
  const thirdSidePuzzleData = createBlankPuzzleData(width, height);
  const fourthSidePuzzleData = createBlankPuzzleData(width, height);

  // Check to make sure there are an equal number of 1s in the grid
  // for every item with a value.
  const itemsWithClues = items.filter(([_, clue]) => clue != null);
  const numOnes = data.grid.flat().filter((cell) => cell === 1).length;
  if (itemsWithClues.length !== numOnes) {
    throw new Error('Number of items does not match number of 1s in the grid');
  }

  let cellNumber = 0;
  let index = 0;
  const puzzle: PuzzleCell[][] = [];
  const solution: SolutionCell[][] = [];
  const clues: Clue[] = [];
  data.grid.forEach((row, x) =>
    row.forEach((cell, y) => {
      if (puzzle[x] == null) {
        puzzle[x] = [];
      }
      if (solution[x] == null) {
        solution[x] = [];
      }
      if (cell === 1) {
        cellNumber++;
        const style: CellStyle | undefined = data.metadata?.[
          index
        ]?.styles.includes('circled')
          ? {
              shapebg: 'circle',
            }
          : undefined;
        const cellValue = {
          cell: cellNumber,
          style,
        };
        puzzle[x].push(cellValue);
        const [emoji, clue] = itemsWithClues[cellNumber - 1];
        const unicode = emojiToUnicode(emoji);
        const value = {
          value: unicode,
          cell: cellNumber,
        };
        solution[x].push(value);

        clues.push({
          number: cellNumber,
          clue: clue ?? '',
          answer: unicode,
        });

        // Store the last column values in the solution
        if (y === row.length - 1) {
          secondSidePuzzleData.puzzle[x][0] = cellValue;
          secondSidePuzzleData.solution[x][0] = value;
        }
        if (y === 0) {
          fourthSidePuzzleData.puzzle[x][row.length - 1] = cellValue;
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
      index++;
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

  puzzleData.clues.Across = clues;
  secondSidePuzzleData.clues.Across = clues;
  thirdSidePuzzleData.clues.Across = clues;
  fourthSidePuzzleData.clues.Across = clues;

  // Convert PuzzleData to CharacterRecord
  return [
    puzzleData,
    secondSidePuzzleData,
    thirdSidePuzzleData,
    fourthSidePuzzleData,
  ];
};

const convertToNumber = (key: string | number) =>
  typeof key === 'string' ? parseInt(key, 10) : key;

// Function to check if arrays are the same size and contain the same items (can be out of order)
const arraysHaveSameItems = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  return (
    arr1.every((item) => set2.has(item)) && arr2.every((item) => set1.has(item))
  );
};

const clueFormatter = ([key, value]: [string | number, string]) => {
  return {
    number: typeof key === 'string' ? parseInt(key, 10) : key,
    clue: value,
  };
};

function deterministicSortStrings(strings: string[], seed: number): string[] {
  // Create a seeded random number generator
  const seededRandom = (index: number): number => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  // Create an array of indices, sort it based on the seeded random values
  const sortedIndices = [...strings.keys()].sort(
    (a, b) => seededRandom(a) - seededRandom(b),
  );

  // Use the sorted indices to create a new array of strings in the determined order
  return sortedIndices.map((index) => strings[index]);
}

const mapToNumber = (object: { [key: number | string]: number[] | string }) =>
  Object.keys(object).map(convertToNumber);

export const createUniqueEmojiList = (
  initialList: string[],
  emojiList: string[],
  numberOfItems: number = 26,
) => {
  const uniqueEmojis = new Set(initialList);
  while (uniqueEmojis.size < numberOfItems) {
    uniqueEmojis.add(emojiList[Math.floor(Math.random() * emojiList.length)]);
  }
  return Array.from(uniqueEmojis);
};

export const convertCrossmojiDataV2 = (
  data: CrossmojiDataV2,
): {
  data: PuzzleData[];
  svgSegments: string[];
} => {
  if (data.version !== '2.0') {
    throw new Error('Invalid version!');
  }

  const width = data.source.grid[0].length;
  const height = data.source.grid.length;

  const svgSegments = new Set(
    Object.values(deterministicSortStrings(data.svgSegments, data.seed)),
  );
  const numEmojis = svgSegments.size;

  if (numEmojis !== data.svgSegments.length) {
    throw new Error('Duplicate emojis found in the grid');
  }

  const sourceCluesDownKeys = mapToNumber(data.source.clues.down);
  const sourceCluesAcrossKeys = mapToNumber(data.source.clues.across);
  const responseCluesDownKeys = mapToNumber(data.response.clues.down);
  const responseCluesAcrossKeys = mapToNumber(data.response.clues.across);

  if (!arraysHaveSameItems(sourceCluesDownKeys, responseCluesDownKeys)) {
    throw new Error('Down clues do not match source clues');
  }
  if (!arraysHaveSameItems(sourceCluesAcrossKeys, responseCluesAcrossKeys)) {
    throw new Error('Across clues do not match source clues');
  }

  // Check to make sure there are an equal number of items in the grid
  // for every LLM supplied value.
  const numItems = data.source.grid.flat().filter((cell) => cell != 0).length;
  // LLM supplied values for each entry in the grid
  const numValues = Object.values(data.response.values).length;
  if (numValues !== numItems) {
    throw new Error('Number of values does not match number cells in the grid');
  }

  const clues: PuzzleData['clues'] = {
    Across: Object.entries(data.response.clues.across).map(clueFormatter),
    Down: Object.entries(data.response.clues.down).map(clueFormatter),
  };

  const firstSidePuzzleData = createBlankPuzzleData(width, height, clues);
  const secondSidePuzzleData = createBlankPuzzleData(width, height, clues);
  const thirdSidePuzzleData = createBlankPuzzleData(width, height, clues);
  const fourthSidePuzzleData = createBlankPuzzleData(width, height, clues);

  data.source.puzzle.forEach((row, x) => {
    row.forEach((cell, y) => {
      if (firstSidePuzzleData.puzzle[x] == null) {
        firstSidePuzzleData.puzzle[x] = [];
      }
      if (firstSidePuzzleData.solution[x] == null) {
        firstSidePuzzleData.solution[x] = [];
      }
      firstSidePuzzleData.puzzle[x][y] = {
        cell,
        style:
          typeof cell === 'number'
            ? data.response.values[cell].styles
            : undefined,
      };
      const value = data.response.solution[x][y];
      firstSidePuzzleData.solution[x][y] =
        value === 0 || cell === '#'
          ? '#'
          : {
              value,
              cell: typeof cell === 'number' ? cell : 0,
            };

      // Store the last column values in the solution
      if (y === row.length - 1) {
        secondSidePuzzleData.puzzle[x][0] = firstSidePuzzleData.puzzle[x][y];
        secondSidePuzzleData.solution[x][0] =
          firstSidePuzzleData.solution[x][y];
      }
      if (y === 0) {
        fourthSidePuzzleData.puzzle[x][row.length - 1] =
          firstSidePuzzleData.puzzle[x][y];
        fourthSidePuzzleData.solution[x][row.length - 1] =
          firstSidePuzzleData.solution[x][y];
      }
    });
  });

  return {
    data: [
      firstSidePuzzleData,
      secondSidePuzzleData,
      thirdSidePuzzleData,
      fourthSidePuzzleData,
    ],
    svgSegments: Array.from(svgSegments),
  };
};

export function isSingleCell(
  puzzle: PuzzleType,
  selected: number,
  selectedSide: number,
  isVerticalOrientation: boolean,
): boolean {
  const cell = puzzle.record.solution[selected];

  const downSequenceIndex = cell?.mapping?.[selectedSide]?.downSequenceIndex;
  const acrossSequenceIndex =
    cell?.mapping?.[selectedSide]?.acrossSequenceIndex;

  if (downSequenceIndex != null && acrossSequenceIndex != null) {
    // Only cells with clues can be single
    const isClueCell = isCellWithNumber(cell.value);
    const downSequence = puzzle.record.wordSequences[downSequenceIndex];
    const acrossSequence = puzzle.record.wordSequences[acrossSequenceIndex];
    return (
      downSequence.length === 1 &&
      acrossSequence.length === 1 &&
      isClueCell === true
    );
  }
  return false;
}

export function getRangeForCell(
  puzzle: PuzzleType,
  selected: number,
  selectedSide: number,
  isVerticalOrientation: boolean,
): number[] {
  const { solution, wordSequences } = puzzle.record;
  const cell = solution[selected];
  const sequenceIndex =
    isVerticalOrientation === false
      ? cell?.mapping?.[selectedSide]?.acrossSequenceIndex
      : cell?.mapping?.[selectedSide]?.downSequenceIndex;
  if (sequenceIndex != null) {
    return wordSequences[sequenceIndex];
  }
  return [];
}
