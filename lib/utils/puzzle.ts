import { PuzzleData, SolutionCell, SolutionCellValue } from '../../types/types';

function isSolutionCellValue(cell: SolutionCell): cell is SolutionCellValue {
  return (cell as SolutionCellValue).value !== undefined;
}

export const getCharacterRecord = (puzzleData: PuzzleData[]) => {
  let id = 0;
  return puzzleData.reduce<SolutionCell[]>((value, { solution }) => {
    const flattened = solution.flatMap((s) => s);
    for (let x = 0; x < flattened.length; x++) {
      const currentCell = flattened[x];
      if (isSolutionCellValue(currentCell)) {
        currentCell.cell = id;
      }
      value[id] = currentCell;
      id += 1;
    }
    return value;
  }, []);
};
