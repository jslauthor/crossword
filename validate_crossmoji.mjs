import emojis from './lib/emoji_unicode_list.mjs';
// import clipboardy from 'clipboardy';

const schema = {
  seed: 840275,
  items: {
    u1F688: 'Urban serpent, gliding on steel',
    u1FAE2: 'Surprise silencer',
    u2B55: 'Endless journey, no corners in sight',
    u1F5FD: 'Torch-bearer of harbor dreams',
    u1F43F: 'Nutty acrobat of park and wood',
    u1FAC5: 'Crowned newcomer to emoji royalty',
    u1F549: 'Eternal sound, sacred in Sanskrit',
    u1F9C9: 'South American stimulant sipped through silver',
    u1FAE3: 'Coy ocular revelation',
    u1F684: 'Velocity vanguard on rails',
    u1F416: "Bacon's origin, pre-sizzle",
    u1F004: "Wind and dragon's tile tango",
    u1F1FA_1F1F8: "Star-spangled banner's domain",
    u1F96F: null,
    u1FAE1: null,
    u1FAB6: null,
    u1F6D7: null,
    u1FADA: null,
    u1F9EC: null,
    u1FABA: null,
    u1FAF1: null,
    u1F3B6: null,
    u1F355: null,
    u1F52D: null,
    u1F0CF: null,
    u1F1F3_1F1F4: null,
  },
  grid: [
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1],
  ],
  metadata: {},
};

// clipboardy.writeSync(JSON.stringify(emojis.map(unicodeToEmoji)));

function validateCrossmojiSchema(schema) {
  let message = 'Successfully validated crossmoji!';
  let isValid = true;

  if (typeof schema !== 'object' || schema === null) {
    message = 'Schema must be an object';
    isValid = false;
    return { isValid, message };
  }

  // 1. Validate seed
  if (!Number.isInteger(schema.seed) || schema.seed.toString().length !== 6) {
    message = 'Seed must be a 6-digit integer';
    isValid = false;
    return { isValid, message };
  }

  // 2. Validate items
  if (!schema.items) {
    message = 'Schema must have an items object';
    isValid = false;
    return { isValid, message };
  }

  const uniqueItems = new Set(Object.keys(schema.items));
  if (uniqueItems.size !== 26) {
    message = 'Schema must have exactly 26 unique items';
    isValid = false;
    return { isValid, message };
  }

  // 3. Validate grid and non-null items count
  const nonNullItemsCount = Object.values(schema.items).filter(
    (item) => item !== null,
  ).length;
  const gridOnesCount = schema.grid.flat().filter((cell) => cell === 1).length;
  if (nonNullItemsCount !== gridOnesCount) {
    message =
      'Number of non-null items must equal the number of 1s in the grid';
    isValid = false;
    return { isValid, message };
  }

  // 4. Validate metadata
  if (schema.metadata) {
    const itemsCount = Object.keys(schema.items).length;
    for (const key of Object.keys(schema.metadata)) {
      const index = parseInt(key, 10);
      if (isNaN(index) || index < 0 || index >= itemsCount) {
        message = 'Metadata keys must be valid indices of items';
        isValid = false;
        return { isValid, message };
      }
    }
  }

  // 5. Validate item keys
  for (const key of Object.keys(schema.items)) {
    if (typeof key !== 'string') {
      message = 'Item keys must be strings';
      isValid = false;
      return { isValid, message };
    }

    const uppercaseEmojis = emojis.map((e) => e.toUpperCase());

    // Check if the emoji is in the list of valid emojis
    if (!uppercaseEmojis.includes(key.toUpperCase())) {
      isValid = false;
      message = `Invalid emoji key: ${key}`;
      return { isValid, message };
    }
  }

  return { isValid, message };
}

// Example usage:
const isValid = validateCrossmojiSchema(schema);
console.log('Schema is:', isValid);
