import { promises as fs } from 'fs';
import { createCrossmojiGrid, processGrid } from 'lib/utils/llm';
import path from 'path';

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
const directoryPath = '../data/multi-emoji-grids';
processGrids(directoryPath).then((results) => {
  results.forEach((result) => {
    if (
      result.puzzle.grid.flatMap((row) => row).filter((cell) => cell !== '#')
        .length > 26
    ) {
      console.log(
        result.grid,
        result.puzzle.grid,
        result.puzzle.grid.flatMap((row) => row).filter((cell) => cell !== '#')
          .length,
      );
    }
    // console.log(
    //   result.grid,
    //   result.puzzle.grid,
    //   result.puzzle.grid.flatMap((row) => row).filter((cell) => cell !== '#')
    //     .length,
    // );
    // console.log(
    //   result.grid,
    //   result.puzzle.grid.map((row) => row.map((cell) => cell.toString())),
    //   result.puzzle.clues.across,
    //   result.puzzle.clues.down,
    // );
  });
});

//TODO Grids can't have more than 26 emojis?
