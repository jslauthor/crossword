import { ProgressEnum } from 'components/svg/PreviewCube';
import {
  Clue,
  PuzzleData,
  SolutionCell,
  SolutionCellValue,
} from '../../types/types';

function isSolutionCellValue(cell: SolutionCell): cell is SolutionCellValue {
  return (cell as SolutionCellValue).value !== undefined;
}

export interface CharacterRecord {
  solution: SolutionCell[];
  clues: {
    across: Clue[];
    down: Clue[];
  };
}

/**
 * This takes an array of puzzle data and returns a single puzzle
 * data object with the solution and clues merged together.
 *
 * @param puzzleData
 */
export const getCharacterRecord = (
  puzzleData: PuzzleData[],
): CharacterRecord => {
  let runningTotal = 0;
  // We need to store the columns we hide so we can grab
  // their cell numbers and add them back in
  const hiddenColumns: SolutionCell[][] = [];
  const data = puzzleData.reduce<{
    solution: SolutionCell[];
    clues: {
      across: Clue[];
      down: Clue[];
    };
  }>(
    (value, { solution, dimensions, clues }, index) => {
      const { width } = dimensions;
      const flattened = solution.flatMap((s) => s);
      if (Array.isArray(hiddenColumns[index]) === false) {
        hiddenColumns[index] = [];
      }
      let highest: number = 0;

      value.clues.across = value.clues.across.concat(
        clues.Across.map((clue) => ({
          ...clue,
          number: clue.number + runningTotal,
        })),
      );

      value.clues.down = value.clues.down.concat(
        clues.Down.map((clue) => ({
          ...clue,
          number: clue.number + runningTotal,
        })),
      );

      for (let x = 0; x < flattened.length; x++) {
        const currentCell = flattened[x];
        const isCell =
          isSolutionCellValue(currentCell) &&
          typeof currentCell.cell === 'number';
        if (x % width === 0) {
          // first column
          // we skip the first column since the last column
          // in the following grid is the same
          value.solution.push('#');
          hiddenColumns[index].push(
            isCell
              ? {
                  // @ts-ignore
                  cell: currentCell.cell + runningTotal,
                  value: currentCell.value,
                }
              : '#',
          );
          continue;
        }
        if (isCell) {
          value.solution.push({
            // @ts-ignore
            cell: currentCell.cell + runningTotal,
            value: currentCell.value,
          });
          // @ts-ignore
          highest = currentCell.cell > highest ? currentCell.cell : highest;
        } else {
          value.solution.push(currentCell);
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
 * This looks at how much the user has filled in and returns a ProgressEnum.
 * This will NEVER return solved, which is a separate flag on the progress model.
 *
 * @param puzzleData
 * @param characterPositions
 */
export const getProgressFromSolution = (
  characterRecord: CharacterRecord,
  characterPositions: Record<string, number>,
): ProgressEnum => {
  const puzzleSize = characterRecord.solution.filter((v) => v !== '#').length;
  const completedSize =
    Object.values(characterPositions.state).filter((v) => v > -1).length / 2;
  const percentage = completedSize / puzzleSize;

  if (percentage <= 0.33) {
    return 0;
  } else if (percentage <= 0.66) {
    return 1;
  }

  return 2;
};
