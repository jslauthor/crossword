#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';

program
  .requiredOption('-d, --directory <path>', 'Directory to scan')
  .requiredOption(
    '-m, --max-files <number>',
    'Maximum number of files to process',
    parseInt,
  )
  .parse(process.argv);

const options = program.opts();

async function getEmojiList(directory, maxFiles) {
  const files = await fs.readdir(directory);
  const processedUnicodes = new Set();
  const emojiList = [];

  for (const file of files.slice(0, maxFiles)) {
    const match = file.match(/emoji_u([0-9a-fA-F]+)/);
    if (match) {
      const unicode = match[1];
      if (!processedUnicodes.has(unicode)) {
        processedUnicodes.add(unicode);
        try {
          const emoji = String.fromCodePoint(parseInt(unicode, 16));
          emojiList.push(emoji);
        } catch (error) {
          console.warn(`Failed to convert unicode ${unicode} to emoji`);
        }
      }
    }
  }

  return emojiList.join('');
}

async function main() {
  try {
    const emojiString = await getEmojiList(options.directory, options.maxFiles);
    await fs.writeFile('emoji_list.txt', emojiString);
    console.log('Emoji list saved to emoji_list.txt');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
