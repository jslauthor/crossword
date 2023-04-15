import fs from 'fs';
import path from 'path';

const puzzleDir = path.join(process.cwd(), 'puzzles');

const getPuzzles = async () => {
  return fs
    .readdirSync(puzzleDir, { withFileTypes: true })
    .filter((file) => file.isDirectory())
    .map((file) => file.name);
};

const getPuzzleById = async (puzzleId: string) => {
  const dir = path.join(puzzleDir, puzzleId);
  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((file) => file.isFile() && !/(^|\/)\.[^\/\.]/g.test(file.name));

  return files.map((file) => {
    // Read markdown file as string
    const fullPath = path.join(dir, file.name);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(fileContents);
  });
};

export { getPuzzleById, getPuzzles };
