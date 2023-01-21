import { PuzzleData, SolutionCell, SolutionCellValue } from '../../types/types';

function isSolutionCellValue(cell: SolutionCell): cell is SolutionCellValue {
  return (cell as SolutionCellValue).value !== undefined;
}

export const getCharacterRecord = (puzzleData: PuzzleData[]) => {
  let runningCellNumbers = 0;
  return puzzleData.reduce<SolutionCell[]>(
    (value, { solution, dimensions }) => {
      const { width } = dimensions;
      const flattened = solution.flatMap((s) => s);
      let highest: number = 0;
      // TODO: add clues to this data type as well
      for (let x = 0; x < flattened.length; x++) {
        if ((x + 1) % width === 0) {
          // we skip the last column since the first column
          // in the following grid is the same as the previous last
          continue;
        }
        const currentCell = flattened[x];
        if (
          isSolutionCellValue(currentCell) &&
          typeof currentCell.cell === 'number'
        ) {
          value.push({
            cell: currentCell.cell + runningCellNumbers,
            value: currentCell.value,
          });
          highest = currentCell.cell > highest ? currentCell.cell : highest;
        } else {
          value.push(currentCell);
        }
      }
      runningCellNumbers = runningCellNumbers + highest;
      return value;
    },
    []
  );
};
