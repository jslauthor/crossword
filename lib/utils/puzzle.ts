import {
  Clue,
  PuzzleData,
  SolutionCell,
  SolutionCellValue,
} from '../../types/types';

function isSolutionCellValue(cell: SolutionCell): cell is SolutionCellValue {
  return (cell as SolutionCellValue).value !== undefined;
}

export const getCharacterRecord = (puzzleData: PuzzleData[]) => {
  let runningTotal = 0;
  return puzzleData.reduce<{
    solution: SolutionCell[];
    clues: {
      across: Clue[];
      down: Clue[];
    };
  }>(
    (value, { solution, dimensions, clues }) => {
      const { width } = dimensions;
      const flattened = solution.flatMap((s) => s);
      let highest: number = 0;

      value.clues.across = value.clues.across.concat(
        clues.Across.map((clue) => ({
          ...clue,
          number: clue.number + runningTotal,
        }))
      );

      value.clues.down = value.clues.down.concat(
        clues.Down.map((clue) => ({
          ...clue,
          number: clue.number + runningTotal,
        }))
      );

      for (let x = 0; x < flattened.length; x++) {
        if (x % width === 0) {
          // we skip the first column since the last column
          // in the following grid is the same
          continue;
        }
        const currentCell = flattened[x];
        if (
          isSolutionCellValue(currentCell) &&
          typeof currentCell.cell === 'number'
        ) {
          value.solution.push({
            cell: currentCell.cell + runningTotal,
            value: currentCell.value,
          });
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
    }
  );
};
