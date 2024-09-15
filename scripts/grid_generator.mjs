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
  return solution.map((row) =>
    row.map((cell) => {
      if (cell === '#') return 0;
      if (cell === 0) return 1;
      return cell; // In case there are other values, keep them as is
    }),
  );
}

// Usage
const directoryPath = '../data/single_moji_grids';
processGrids(directoryPath).then((grids) => {
  console.log(JSON.stringify(grids, null, 2));
});
