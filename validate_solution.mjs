#!/usr/bin/env node

import { program } from 'commander';

program.parse(process.argv);

function isValidSolution(puzzle, keyboard) {
  let isValid = true;
  const solutionUnicodes = puzzle.reduce((acc, puzzleSide) => {
    puzzleSide.solution
      .flat()
      .map((cell) => cell.value)
      .forEach((value) => {
        if (value != null) acc.add(value);
      });
    return acc;
  }, new Set());

  for (const code of solutionUnicodes.values()) {
    if (
      keyboard.find((u) => u.toLowerCase() === code.toLowerCase()) === undefined
    ) {
      console.log(`Missing ${code} in solution!`);
      isValid = false;
      break;
    }
  }

  return isValid;
}

async function main() {
  const sides = [
    {
      kind: ['http://ipuz.org/crossword#1'],
      clues: {
        Down: [
          {
            clue: "Immortal beings with pointy ears, not quite Galadriel's stature",
            number: 1,
          },
          {
            clue: 'Glows blue when orcs are near, but not as long as Andúril',
            number: 2,
          },
          {
            clue: 'Starts gray, ends white, fond of pipeweed and fireworks',
            number: 3,
          },
          {
            clue: 'Seven-tiered citadel, not to be confused with Minas Morgul',
            number: 4,
          },
          {
            clue: 'Treasure-hoarding beast, vulnerable only to a single black arrow',
            number: 5,
          },
        ],
        Across: [
          {
            clue: "Immortal beings with pointy ears, not quite Galadriel's stature",
            number: 1,
          },
          {
            clue: 'Glows blue when orcs are near, but not as long as Andúril',
            number: 2,
          },
          {
            clue: 'Starts gray, ends white, fond of pipeweed and fireworks',
            number: 3,
          },
          {
            clue: 'Seven-tiered citadel, not to be confused with Minas Morgul',
            number: 4,
          },
          {
            clue: 'Treasure-hoarding beast, vulnerable only to a single black arrow',
            number: 5,
          },
        ],
      },
      intro: '',
      notes: '',
      title: '',
      author: '',
      origin: 'Crossword Compiler 11.26',
      puzzle: [
        [1, '#', 2],
        ['#', 3, '#'],
        [4, '#', 5],
      ],
      version: 'http://ipuz.org/v2',
      solution: [
        [
          {
            cell: 1,
            value: 'u1F9DD',
          },
          '#',
          {
            cell: 2,
            value: 'u1F5E1',
          },
        ],
        [
          '#',
          {
            cell: 3,
            value: 'u1F9D9',
          },
          '#',
        ],
        [
          {
            cell: 4,
            value: 'u1F3F0',
          },
          '#',
          {
            cell: 5,
            value: 'u1F409',
          },
        ],
      ],
      copyright: '',
      dimensions: {
        width: 3,
        height: 3,
      },
      showenumerations: false,
    },
    {
      kind: ['http://ipuz.org/crossword#1'],
      clues: {
        Down: [
          {
            clue: 'Glows blue when orcs are near, but not as long as Andúril',
            number: 1,
          },
          {
            clue: 'Fiery forge where the One Ring was created and destroyed',
            number: 2,
          },
          {
            clue: 'Stone-turning creatures outwitted by a time-stalling wizard',
            number: 3,
          },
          {
            clue: 'Treasure-hoarding beast, vulnerable only to a single black arrow',
            number: 4,
          },
          {
            clue: "Manwë's messengers, notorious for late rescue appearances",
            number: 5,
          },
        ],
        Across: [
          {
            clue: 'Glows blue when orcs are near, but not as long as Andúril',
            number: 1,
          },
          {
            clue: 'Fiery forge where the One Ring was created and destroyed',
            number: 2,
          },
          {
            clue: 'Stone-turning creatures outwitted by a time-stalling wizard',
            number: 3,
          },
          {
            clue: 'Treasure-hoarding beast, vulnerable only to a single black arrow',
            number: 4,
          },
          {
            clue: "Manwë's messengers, notorious for late rescue appearances",
            number: 5,
          },
        ],
      },
      intro: '',
      notes: '',
      title: '',
      author: '',
      origin: 'Crossword Compiler 11.26',
      puzzle: [
        [1, '#', 2],
        ['#', 3, '#'],
        [4, '#', 5],
      ],
      version: 'http://ipuz.org/v2',
      solution: [
        [
          {
            cell: 1,
            value: 'u1F5E1',
          },
          '#',
          {
            cell: 2,
            value: 'u1F30B',
          },
        ],
        [
          '#',
          {
            cell: 3,
            value: 'u1F9CC',
          },
          '#',
        ],
        [
          {
            cell: 4,
            value: 'u1F409',
          },
          '#',
          {
            cell: 5,
            value: 'u1F985',
          },
        ],
      ],
      copyright: '',
      dimensions: {
        width: 3,
        height: 3,
      },
      showenumerations: false,
    },
    {
      kind: ['http://ipuz.org/crossword#1'],
      clues: {
        Down: [
          {
            clue: 'Fiery forge where the One Ring was created and destroyed',
            number: 1,
          },
          {
            clue: "Lord of all steeds, faster than Nazgûl's winged mounts",
            number: 2,
          },
          {
            clue: 'Shepherds of the forest, not hasty in their decisions',
            number: 3,
          },
          {
            clue: "Manwë's messengers, notorious for late rescue appearances",
            number: 4,
          },
          {
            clue: "Guide through Mordor, more reliable than Gollum's directions",
            number: 5,
          },
        ],
        Across: [
          {
            clue: 'Fiery forge where the One Ring was created and destroyed',
            number: 1,
          },
          {
            clue: "Lord of all steeds, faster than Nazgûl's winged mounts",
            number: 2,
          },
          {
            clue: 'Shepherds of the forest, not hasty in their decisions',
            number: 3,
          },
          {
            clue: "Manwë's messengers, notorious for late rescue appearances",
            number: 4,
          },
          {
            clue: "Guide through Mordor, more reliable than Gollum's directions",
            number: 5,
          },
        ],
      },
      intro: '',
      notes: '',
      title: '',
      author: '',
      origin: 'Crossword Compiler 11.26',
      puzzle: [
        [1, '#', 2],
        ['#', 3, '#'],
        [4, '#', 5],
      ],
      version: 'http://ipuz.org/v2',
      solution: [
        [
          {
            cell: 1,
            value: 'u1F30B',
          },
          '#',
          {
            cell: 2,
            value: 'u1F40E',
          },
        ],
        [
          '#',
          {
            cell: 3,
            value: 'u1F333',
          },
          '#',
        ],
        [
          {
            cell: 4,
            value: 'u1F985',
          },
          '#',
          {
            cell: 5,
            value: 'u1F9ED',
          },
        ],
      ],
      copyright: '',
      dimensions: {
        width: 3,
        height: 3,
      },
      showenumerations: false,
    },
    {
      kind: ['http://ipuz.org/crossword#1'],
      clues: {
        Down: [
          {
            clue: "Lord of all steeds, faster than Nazgûl's winged mounts",
            number: 1,
          },
          {
            clue: "Immortal beings with pointy ears, not quite Galadriel's stature",
            number: 2,
          },
          {
            clue: "Parchment with 'Here be dragons' actually meaning something",
            number: 3,
          },
          {
            clue: "Guide through Mordor, more reliable than Gollum's directions",
            number: 4,
          },
          {
            clue: 'Seven-tiered citadel, not to be confused with Minas Morgul',
            number: 5,
          },
        ],
        Across: [
          {
            clue: "Lord of all steeds, faster than Nazgûl's winged mounts",
            number: 1,
          },
          {
            clue: "Immortal beings with pointy ears, not quite Galadriel's stature",
            number: 2,
          },
          {
            clue: "Parchment with 'Here be dragons' actually meaning something",
            number: 3,
          },
          {
            clue: "Guide through Mordor, more reliable than Gollum's directions",
            number: 4,
          },
          {
            clue: 'Seven-tiered citadel, not to be confused with Minas Morgul',
            number: 5,
          },
        ],
      },
      intro: '',
      notes: '',
      title: '',
      author: '',
      origin: 'Crossword Compiler 11.26',
      puzzle: [
        [1, '#', 2],
        ['#', 3, '#'],
        [4, '#', 5],
      ],
      version: 'http://ipuz.org/v2',
      solution: [
        [
          {
            cell: 1,
            value: 'u1F40E',
          },
          '#',
          {
            cell: 2,
            value: 'u1F9DD',
          },
        ],
        [
          '#',
          {
            cell: 3,
            value: 'u1F5FA',
          },
          '#',
        ],
        [
          {
            cell: 4,
            value: 'u1F9ED',
          },
          '#',
          {
            cell: 5,
            value: 'u1F3F0',
          },
        ],
      ],
      copyright: '',
      dimensions: {
        width: 3,
        height: 3,
      },
      showenumerations: false,
    },
  ];

  const unicodes = [
    'u1f9dd',
    'u2694',
    'u1f9d9',
    'u1f3f0',
    'u1f409',
    'u1f30b',
    'u1f9cc',
    'u1f985',
    'u1f40e',
    'u1f333',
    'u1f9ed',
    'u1f5fa',
    'u1f3d4',
    'u1f30a',
    'u1f6e1',
    'u1f9da',
    'u1f3f9',
    'u1f9de',
    'u1f356',
    'u1f52e',
    'u1f9f3',
    'u1fa84',
    'u1f9ea',
    'u1fa99',
    'u1f56f',
    'u1f9f5',
  ];

  console.log(isValidSolution(sides, unicodes));
}

main();
