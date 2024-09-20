type Cell = number | string | object;
type Clues = { across: Map<number, number[]>; down: Map<number, number[]> };
type Grid = Cell[][];

export function processGrid(solution: Grid) {
  let counter = 1;
  const grid = solution.map((row) =>
    row.map((cell) => {
      if (cell === '#') return 0;
      else return counter++;
    }),
  );

  return grid;
}

export function createCrossmojiGrid(input: Grid): { grid: Grid; clues: Clues } {
  const clues: Clues = { across: new Map(), down: new Map() };
  const grid: Grid = [];
  let cellNumber = 1;

  function shouldNumberCell(row: number, col: number): boolean {
    const isStartOfAcross = col === 0 || input[row][col - 1] === 0;
    const isStartOfDown = row === 0 || input[row - 1][col] === 0;
    const hasAcrossContinuation =
      col < input[row].length - 1 && input[row][col + 1] !== 0;
    const hasDownContinuation =
      row < input.length - 1 && input[row + 1][col] !== 0;
    const isSingleCell =
      (col === 0 || input[row][col - 1] === 0) &&
      (col === input[row].length - 1 || input[row][col + 1] === 0) &&
      (row === 0 || input[row - 1][col] === 0) &&
      (row === input.length - 1 || input[row + 1][col] === 0);

    if ((isStartOfAcross && hasAcrossContinuation) || isSingleCell) {
      clues.across.set(cellNumber, getConsecutiveNumbers(row, col, 'across'));
    }
    if (isStartOfDown && hasDownContinuation) {
      clues.down.set(cellNumber, getConsecutiveNumbers(row, col, 'down'));
    }

    return (
      (isStartOfAcross && hasAcrossContinuation) ||
      (isStartOfDown && hasDownContinuation) ||
      isSingleCell
    );
  }

  function getConsecutiveNumbers(
    row: number,
    col: number,
    direction: 'across' | 'down',
  ): number[] {
    const numbers: number[] = [];
    let currentRow = row;
    let currentCol = col;

    while (
      currentRow < input.length &&
      currentCol < input[currentRow].length &&
      input[currentRow][currentCol] !== 0
    ) {
      numbers.push(input[currentRow][currentCol] as number);
      if (direction === 'across') {
        currentCol++;
      } else {
        currentRow++;
      }
    }

    return numbers;
  }

  for (let row = 0; row < input.length; row++) {
    grid[row] = [];
    for (let col = 0; col < input[row].length; col++) {
      if (input[row][col] === 0) {
        grid[row][col] = '#';
      } else if (shouldNumberCell(row, col)) {
        grid[row][col] = cellNumber++;
      } else {
        grid[row][col] = ':';
      }
    }
  }

  return { grid, clues };
}
