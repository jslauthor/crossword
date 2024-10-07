import emojis from '../lib/emoji_unicode_list.mjs';
// import clipboardy from 'clipboardy';

const schema = {
  seed: 840275,
  items: {
    u1f339: 'Shakespearean beauty with thorny disposition',
    u1f337: 'Dutch auction item, once worth a fortune',
    u1f33b: "Helios' follower, towering over fields",
    u1f33a: "Tiger's tropical namesake, not for the pond",
    u1f4a0: "Trumpet of spring, with a foolish month's name",
    u1f338: "Ants' favorite, blooming with imperial grace",
    u1f33a: 'Hawaiian lei staple, not to be confused with shoes',
    u1f940: "Flanders' remembrance, with soporific qualities",
    u1f308: 'Messenger of the gods, with a colorful bridge',
    u1f49c: 'Sweet by any other name, with Napoleonic ties',
    u2b50: 'Night-blooming celestial body, not in the sky',
    u1f3f3: 'Thoughtful bloom with a face, not for surrender',
    u1f98e: 'Dragon-mouthed flower, snapping at bees',
    u1f33e: "Masters' backdrop, blooming in acidic soil",
    u1f499: 'Alpine reminder, namesake of royal eyes',
    u1f33c: 'Fresh as this, yet pushing up from below',
    u1f4ae: 'Eastern blossom, prized for its vanilla essence',
    u1f490: 'Dianthus cluster, not for the faint of heart',
    u1f3f0: 'Purple spikes, fit for a Provencal fortress',
    u1f4b0: 'Southern belle, fragrant as a New Orleans night',
    u1f4b1: 'Golden chalice, not for financial exchange',
    u1f33d: null,
    u1f33f: null,
    u1f4a7: null,
    u1f341: null,
    u1f3f4: null,
  },
  grid: [
    [1, 0, 1, 0, 0, 1, 0, 1],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1, 0, 0, 0],
    [1, 0, 1, 0, 0, 1, 0, 1],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [1, 0, 1, 0, 0, 1, 0, 1],
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
