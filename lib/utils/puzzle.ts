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
        }))
      );

      value.clues.down = value.clues.down.concat(
        clues.Down.map((clue) => ({
          ...clue,
          number: clue.number + runningTotal,
        }))
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
              : '#'
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
    }
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
