import { promises as fs } from 'fs';
import { createCrossmojiGrid, processGrid } from 'lib/utils/llm';
import path from 'path';
import clipboardy from 'clipboardy';

async function processGrids(directoryPath: string) {
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
          grids.push({
            grid: processedGrid,
            puzzle: createCrossmojiGrid(processedGrid),
            filePath,
          });
        }
      }
    }

    return grids;
  } catch (error) {
    console.error('Error processing grids:', error);
    return [];
  }
}

// Usage
const directoryPath = '../data/single-emoji-grids';
processGrids(directoryPath).then((results) => {
  const valid = results
    .filter(
      (result) =>
        result.puzzle.grid.flatMap((row) => row).filter((cell) => cell !== '#')
          .length <= 26,
    )
    .map((result) => {
      const convertedPuzzle = {
        grid: result.grid,
        puzzle: result.puzzle.grid,
        clues: {
          across: Object.fromEntries(result.puzzle.clues.across),
          down: Object.fromEntries(result.puzzle.clues.down),
        },
      };
      return convertedPuzzle;
    });

  console.log(JSON.stringify(valid, null, 2));
  clipboardy.writeSync(JSON.stringify(valid, null, 2));
});
