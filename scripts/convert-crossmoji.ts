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
  seed: 634034,
  response: {
    title: 'Iconic Mix-up',
    values: {
      '1': { value: 'u1f431' },
      '2': { value: 'u2708' },
      '3': { value: 'u1f352' },
      '4': { value: 'u1f436' },
      '5': { value: 'u1f353' },
      '6': { value: 'u1f4de' },
      '7': { value: 'u1f34f' },
      '8': { value: 'u1f697' },
      '9': { value: 'u2615' },
      '10': { value: 'u1f6e3' },
      '11': { value: 'u1f511' },
      '12': { value: 'u1f369' },
    },
    clues: {
      across: {
        '2': 'Frequent flyer',
        '4': 'It rings when you call',
        '5': 'Forbidden fruit',
        '8': 'It unlocks things',
      },
      down: {
        '1': 'Popular pets',
        '3': 'Red fruit duo',
        '6': 'On the road',
        '7': 'Morning treat',
      },
    },
    solution: [
      ['u1f431', 0, 'u2708', 0, 'u1f352'],
      ['u1f436', 0, 0, 0, 'u1f353'],
      [0, 'u1f4de', 0, 'u1f34f', 0],
      ['u1f697', 0, 0, 0, 'u2615'],
      ['u1f6e3', 0, 'u1f511', 0, 'u1f369'],
    ],
  },
  source: {
    grid: [
      [1, 0, 2, 0, 3],
      [4, 0, 0, 0, 5],
      [0, 6, 0, 7, 0],
      [8, 0, 0, 0, 9],
      [10, 0, 11, 0, 12],
    ],
    clues: {
      down: { '1': [1, 4], '3': [3, 5], '6': [8, 10], '7': [9, 12] },
      across: { '2': [2], '4': [6], '5': [7], '8': [11] },
    },
    puzzle: [
      [1, '#', 2, '#', 3],
      [':', '#', '#', '#', ':'],
      ['#', 4, '#', 5, '#'],
      [6, '#', '#', '#', 7],
      [':', '#', 8, '#', ':'],
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
