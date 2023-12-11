import { PuzzleData, SolutionCell } from 'types/types';
import { Command } from 'commander';
import chokidar from 'chokidar';
import clipboardy from 'clipboardy';
import path from 'path';
import fs from 'fs';

const program = new Command();
program.option(
  '-p, --path [string]',
  'relative path to a folder that contains four ipuz files labeled 1.ipuz, 2.ipuz, 3.ipuz, and 4.ipuz',
);
program.parse();

const validatePuzzle = (record: PuzzleData[]) => {
  const flattened = record.reduce((acc: SolutionCell[], side) => {
    return [...acc, ...side.solution.flatMap((s) => s)];
  }, []);
  let across: string[] = [];
  let current = '';
  let count = 0;
  for (let i = 0; i < flattened.length; i++) {
    const cell = flattened[i];
    const save = () => {
      if (current.length > 1) {
        across.push(current);
      }
      current = '';
    };

    if (count === record[0].dimensions.width) {
      save();
      count = 0;
    }

    if (cell !== '#') {
      current += cell.value;
    } else if (flattened[i + 1] !== '#') {
      save();
    }

    count++;
    if (i === flattened.length - 1) {
      save();
    }
  }

  let down: string[][] = [[], [], [], []];
  let columns: string[][] = [[], [], [], []];
  current = '';
  for (let side = 0; side < record.length; side++) {
    const sideIndex = side * record[0].dimensions.width ** 2;
    for (let i = 0; i < record[0].dimensions.width; i++) {
      let save = () => {};
      for (let j = 0; j < record[0].dimensions.width; j++) {
        const index = sideIndex + i + j * record[0].dimensions.width;
        const cell = flattened[index];
        save = () => {
          if (current.length > 1) {
            if (
              index % record[0].dimensions.width ===
              record[0].dimensions.width - 1
            ) {
              columns[side].push(current);
            } else {
              down[side].push(current);
            }
          }
          current = '';
        };

        if (cell !== '#') {
          current += cell.value;
        } else if (flattened[index + record[0].dimensions.width] !== '#') {
          save();
        }
      }
      save();
    }
  }

  // Reorder the columns to match the down clues
  const last = columns.pop();
  if (last != null) {
    columns.unshift(last);
  }

  /**
   * Begin Validations
   */

  const allWords = [...down.flatMap((d) => d), ...across];
  let message = 'Puzzle is valid!';

  // All answers should be at least 3 characters
  allWords.forEach((word) => {
    if (word.length < 3) {
      message = `Answer "${word}" is less than 3 characters`;
    }
  });
  // Left and right columns should match
  columns.forEach((column, index) => {
    column.forEach((answer, i) => {
      if (answer !== down[index][i]) {
        message = `Left and right columns do not match: ${answer} !== ${down[index][i]}`;
      }
    });
  });
  // No two words should be the same (except left and right columns)
  allWords.forEach((_, index) => {
    const otherAnswers = allWords.filter((_, i) => i !== index);
    if (otherAnswers.includes(allWords[index])) {
      message = `Duplicate answer found: ${allWords[index]} at index ${index}`;
    }
  });

  // All clues must be longer than 0 characters
  record.forEach((side, index) => {
    side.clues.Across.forEach((clue) => {
      if (clue.clue.length < 1) {
        message = `Found empty clue! Side: ${index} Number: ${clue.number}`;
      }
    });
    side.clues.Down.forEach((clue) => {
      if (clue.clue.length < 1) {
        message = `Found empty clue! Side: ${index} Number: ${clue.number}`;
      }
    });
  });

  return message;
};

const dir = path.join(process.cwd(), program.opts().path);

const update = () => {
  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (file) =>
        file.isFile() &&
        !/(^|\/)\.[^\/\.]/g.test(file.name) &&
        path.extname(file.name) === '.ipuz',
    );

  const puzzleData = files.map((file) => {
    // Read markdown file as string
    const fullPath = path.join(dir, file.name);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(fileContents);
  });

  clipboardy.writeSync(JSON.stringify(puzzleData));

  console.clear();
  console.log(`Watching for changes on ${dir}...`);
  console.log(validatePuzzle(puzzleData));
};

const watcher = chokidar.watch(dir, { persistent: true });
watcher.on('change', update);

update();
