import { promises as fs } from 'fs';
import path from 'path';

async function processGrids(directoryPath) {
  const grids = [];

  try {
    const files = await fs.readdir(directoryPath);

    for (const file of files) {
      if (path.extname(file) === '.ipuz') {
        const filePath = path.join(directoryPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const puzzleData = JSON.parse(content);

        if (puzzleData.solution) {
          const processedGrid = processGrid(puzzleData.solution);
          grids.push(processedGrid);
        }
      }
    }

    return grids;
  } catch (error) {
    console.error('Error processing grids:', error);
    return [];
  }
}

function processGrid(solution) {
  let counter = 1;
  const grid = solution.map((row) =>
    row.map((cell) => {
      if (cell === '#') return 0;
      else return counter++;
    }),
  );

  const sequences = {
    across: {},
    down: {},
  };

  // Process across sequences
  grid.forEach((row, rowIndex) => {
    let currentSequence = [];
    row.forEach((cell, colIndex) => {
      if (cell !== 0) {
        currentSequence.push(cell);
      }
      if (cell === 0 || colIndex === row.length - 1) {
        if (currentSequence.length > 0) {
          sequences.across[currentSequence[0]] = currentSequence;
          currentSequence = [];
        }
      }
    });
  });

  // Process down sequences
  for (let colIndex = 0; colIndex < grid[0].length; colIndex++) {
    let currentSequence = [];
    for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
      const cell = grid[rowIndex][colIndex];
      if (cell !== 0) {
        currentSequence.push(cell);
      }
      if (cell === 0 || rowIndex === grid.length - 1) {
        if (currentSequence.length > 0) {
          sequences.down[currentSequence[0]] = currentSequence;
          currentSequence = [];
        }
      }
    }
  }

  // Todo remove single across and down clues unless they are a sequence of 1
  // Todo build a puzzle grid of clues with the correct cell values
  // - be sure the sequences match the cell values

  return { grid, sequences };
}

// Usage
const directoryPath = '../data/multi-emoji-grids';
processGrids(directoryPath).then((results) => {
  console.log(JSON.stringify(results));
});
