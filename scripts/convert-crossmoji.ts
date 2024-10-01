import {
  convertCrossmojiDataV2,
  createUniqueEmojiList,
} from 'lib/utils/puzzle';
import emojiUnicodeList from 'lib/emojiUnicodeList.mjs';
import { CrossmojiDataV2 } from 'types/types';
import clipboardy from 'clipboardy';

const data: CrossmojiDataV2 = {
  version: '2.0',
  svgSegments: [],
  seed: 640599,
  response: {
    title: 'Symbolic Associations',
    values: {
      '1': {
        value: 'u2600',
      },
      '2': {
        value: 'u1f60d',
      },
      '3': {
        value: 'u1f453',
      },
      '4': {
        value: 'u1f333',
      },
      '5': {
        value: 'u1f3e0',
      },
      '6': {
        value: 'u1f442',
      },
      '7': {
        value: 'u1f48d',
      },
      '8': {
        value: 'u1f60e',
      },
      '9': {
        value: 'u1f451',
      },
      '10': {
        value: 'u1f4a1',
      },
      '11': {
        value: 'u1f934',
      },
      '12': {
        value: 'u1f478',
      },
    },
    clues: {
      across: {
        '2': 'Smitten expression',
        '3': 'Elevated lodging for kids',
        '4': 'Stud or hoop for a lobe',
        '5': 'Cool customer',
        '7': 'Symbol of inspiration',
        '8': 'Royal offspring',
      },
      down: {
        '1': 'Bright accessory',
        '6': 'Heir apparent',
      },
    },
    solution: [
      ['u2600', 0, 'u1f60d', 0, 0],
      ['u1f453', 0, 0, 'u1f333', 'u1f3e0'],
      [0, 'u1f442', 'u1f48d', 0, 0],
      ['u1f60e', 0, 0, 'u1f451', 0],
      [0, 'u1f4a1', 0, 'u1f934', 'u1f478'],
    ],
  },
  source: {
    grid: [
      [1, 0, 2, 0, 0],
      [3, 0, 0, 4, 5],
      [0, 6, 7, 0, 0],
      [8, 0, 0, 9, 0],
      [0, 10, 0, 11, 12],
    ],
    clues: {
      down: {
        '1': [1, 3],
        '6': [9, 11],
      },
      across: {
        '2': [2],
        '3': [4, 5],
        '4': [6, 7],
        '5': [8],
        '7': [10],
        '8': [11, 12],
      },
    },
    puzzle: [
      [1, '#', 2, '#', '#'],
      [':', '#', '#', 3, ':'],
      ['#', 4, ':', '#', '#'],
      [5, '#', '#', 6, '#'],
      ['#', 7, '#', 8, ':'],
    ],
  },
};

data.svgSegments = createUniqueEmojiList(
  Object.values(data.response.values).map(({ value }) => value),
  emojiUnicodeList,
);

const converted = convertCrossmojiDataV2(data);
clipboardy.writeSync(JSON.stringify(data, null, 2));

console.log(JSON.stringify(data, null, 2));
