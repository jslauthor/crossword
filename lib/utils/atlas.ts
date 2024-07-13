export type AtlasType = Record<string, [number, number]>;

export const TEXTURE_MAP_SIZE = 2048;
export const NUMBER_OF_NUMBERS_PER_LINE = 6;
export const NUMBER_OF_CELLS_PER_LINE = 17; // 22 is the number of cells in the 3D grid - 1

const characterItems: string[] = [];
for (let x = 0; x < 10; x++) {
  characterItems.push(x.toString(10));
}
for (let x = 0; x <= 25; x++) {
  characterItems.push(String.fromCharCode(65 + x));
}

const numberItems: string[] = [];
for (let x = 0; x <= NUMBER_OF_CELLS_PER_LINE ** 2; x++) {
  numberItems.push(x.toString(10));
}

export const generateTextureRecord = (
  items = characterItems,
  size = NUMBER_OF_NUMBERS_PER_LINE,
): AtlasType => {
  // It's a 6x6 grid that contains A-Z and 0-9 (36 total items)
  let position = 0;
  const grid: Record<string, [number, number]> = {};
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      grid[items[position]] = [x, y];
      position += 1;
    }
  }

  return grid;
};

export const TEXTURE_RECORD = generateTextureRecord();
export const NUMBER_RECORD = generateTextureRecord(
  numberItems,
  NUMBER_OF_CELLS_PER_LINE,
);
