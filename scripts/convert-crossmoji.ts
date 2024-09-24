import {
  convertCrossmojiDataV2,
  createUniqueEmojiList,
} from 'lib/utils/puzzle';
import emojiUnicodeList from 'lib/emojiUnicodeList.mjs';
import { CrossmojiDataV2 } from 'types/types';

const data: CrossmojiDataV2 = {
  version: '2.0',
  seed: 458769,
  svgSegments: [
    'u1f30a',
    'u1f3a4',
    'u1f3b5',
    'u1f4a1',
    'u1f4ad',
    'u1f525',
    'u1f52a',
    'u1f37d',
    'u1f375',
    'u2615',
    'u1f382',
    'u1f389',
    'u1f973',
    'u1f449_1f3fc',
    'u2603',
    'u1f929',
    'u1f90f_1f3fd',
    'u1f477_1f3ff',
    'u1f1e8_1f1f1',
    'u1f94c',
    'u1f9d6',
    'u1f4b3',
    'u1f48f_1f3fb',
    'u1f321',
    'u1f1f3_1f1ea',
    'u1f458',
  ],
  response: {
    title: 'Symbolic Expressions',
    values: {
      '1': { value: 'u1f30a' },
      '2': { value: 'u1f3a4' },
      '3': { value: 'u1f3b5' },
      '4': { value: 'u1f4a1' },
      '5': { value: 'u1f4ad' },
      '6': { value: 'u1f525' },
      '7': { value: 'u1f52a' },
      '8': { value: 'u1f37d' },
      '9': { value: 'u1f375' },
      '10': { value: 'u2615' },
      '11': { value: 'u1f382' },
      '12': { value: 'u1f389' },
      '13': { value: 'u1f973' },
    },
    clues: {
      across: {
        '1': "Surf's up!",
        '2': 'Hit single?',
        '3': 'Bright idea',
        '4': 'Hot take',
        '5': 'Plate setting',
        '6': 'Tea time',
        '7': 'Party popper',
        '8': 'Face with party horn, e.g.',
      },
      down: {
        '2': 'Mic drop',
        '3': 'Thought bubble',
        '4': 'Knife skills',
        '6': 'Birthday brew',
      },
    },
    solution: [
      ['u1f30a', 0, 0, 'u1f3a4', 'u1f3b5'],
      [0, 0, 'u1f4a1', 'u1f4ad', 0],
      [0, 'u1f525', 'u1f52a', 0, 'u1f37d'],
      ['u1f375', 'u2615', 0, 0, 0],
      ['u1f382', 0, 'u1f389', 0, 'u1f973'],
    ],
  },
  source: {
    grid: [
      [1, 0, 0, 2, 3],
      [0, 0, 4, 5, 0],
      [0, 6, 7, 0, 8],
      [9, 10, 0, 0, 0],
      [11, 0, 12, 0, 13],
    ],
    clues: {
      down: { '2': [2, 5], '3': [4, 7], '4': [6, 10], '6': [9, 11] },
      across: {
        '1': [1],
        '2': [2, 3],
        '3': [4, 5],
        '4': [6, 7],
        '5': [8],
        '6': [9, 10],
        '7': [12],
        '8': [13],
      },
    },
    puzzle: [
      [1, '#', '#', 2, ':'],
      ['#', '#', 3, ':', '#'],
      ['#', 4, ':', '#', 5],
      [6, ':', '#', '#', '#'],
      [':', '#', 7, '#', 8],
    ],
  },
};

// data.svgSegments = createUniqueEmojiList(
//   Object.values(data.response.values).map(({ value }) => value),
//   emojiUnicodeList,
// );

const converted = convertCrossmojiDataV2(data);
console.log(converted);
