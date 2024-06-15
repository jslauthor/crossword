import fs from 'fs';
import path from 'path';
import satori, { init } from 'satori';
import Yoga from 'yoga-wasm-web';
import sharp from 'sharp';

const TEXTURE_MAP_SIZE = 2048;
const NUMBER_OF_NUMBERS_PER_LINE = 6;
const NUMBER_OF_CELLS_PER_LINE = 17; // 22 is the number of cells in the 3D grid - 1

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
) => {
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
const TEXTURE_RECORD_ITEMS = Object.keys(TEXTURE_RECORD).map((item: string) => (
  <div
    style={{
      display: 'flex',
      width: `${TEXTURE_MAP_SIZE / NUMBER_OF_NUMBERS_PER_LINE}px`,
      height: `${TEXTURE_MAP_SIZE / NUMBER_OF_NUMBERS_PER_LINE}px`,
      aspectRatio: '1 / 1',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Franklin Gothic',
      lineHeight: '1px',
      fontWeight: 500,
      fontSize: '210px',
      color: 'white',
    }}
    key={item}
  >
    <div style={{ marginTop: '-30px' }}>{item}</div>
  </div>
));

export const TextureAtlas: React.FC = () => (
  <div
    style={{
      display: 'flex',
      aspectRatio: '1 / 1',
      position: 'absolute',
      top: 0,
      left: 0,
      width: `${TEXTURE_MAP_SIZE}px`, // 2k texture map
    }}
  >
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexWrap: 'wrap',
      }}
    >
      {TEXTURE_RECORD_ITEMS}
    </div>
  </div>
);

export const SingleCharacterTexture: React.FC<{ character: string }> = ({
  character,
}) => (
  <div
    style={{
      display: 'flex',
      aspectRatio: '1 / 1',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '256px',
    }}
  >
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '256px',
          height: '256px',
          aspectRatio: '1 / 1',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Franklin Gothic',
          fontSize: '150px',
          color: 'white',
        }}
      >
        {character}
      </div>
    </div>
  </div>
);

export const NUMBER_RECORD = generateTextureRecord(
  numberItems,
  NUMBER_OF_CELLS_PER_LINE,
);
const NUMBER_RECORD_ITEMS = Object.keys(NUMBER_RECORD).map((item: string) =>
  item == null ? null : (
    <div
      key={item}
      style={{
        display: 'flex',
        width: `${Math.floor(TEXTURE_MAP_SIZE / NUMBER_OF_CELLS_PER_LINE)}px`,
        height: `${Math.floor(TEXTURE_MAP_SIZE / NUMBER_OF_CELLS_PER_LINE)}px`,
        fontFamily: 'Franklin Gothic',
        fontSize: '55px',
        fontWeight: 500,
        lineHeight: '1px',
        color: 'white',
        paddingTop: 15,
        paddingLeft: 5,
      }}
    >
      {item}
    </div>
  ),
);

export const NumberAtlas: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      aspectRatio: '1 / 1',
      width: `${TEXTURE_MAP_SIZE}px`, // 2k texture map
      height: `${TEXTURE_MAP_SIZE}px`, // 2k texture map
      padding: 0,
      margin: 0,
    }}
  >
    {NUMBER_RECORD_ITEMS}
  </div>
);

const publicDir = path.join(process.cwd(), 'public');

const saveElementToDisk = async (
  element: JSX.Element,
  filename: string,
  size: number = TEXTURE_MAP_SIZE,
) => {
  const font = fs.readFileSync(
    path.join(process.cwd(), 'public', 'franklin_gothic_regular.ttf'),
  );
  const fontMedium = fs.readFileSync(
    path.join(process.cwd(), 'public', 'franklin_gothic_medium.otf'),
  );
  const wasm = fs.readFileSync(
    path.join(
      process.cwd(),
      'node_modules',
      'yoga-wasm-web',
      'dist',
      'yoga.wasm',
    ),
  );
  // @ts-ignore
  const yoga = await Yoga(wasm);
  init(yoga);
  const svg = await satori(element, {
    width: size,
    height: size,
    fonts: [
      {
        name: 'Franklin Gothic',
        data: font as ArrayBuffer | Buffer,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Franklin Gothic',
        data: fontMedium as ArrayBuffer | Buffer,
        weight: 500,
        style: 'normal',
      },
    ],
  });

  const pngBuffer = await sharp(Buffer.from(svg))
    .png({ quality: 5 })
    .toBuffer();
  fs.writeFileSync(publicDir + filename, pngBuffer);
};

export const generateTextures = async () => {
  await saveElementToDisk(<TextureAtlas />, '/texture_atlas.png');
  await saveElementToDisk(<NumberAtlas />, '/number_atlas.png');
  await saveElementToDisk(
    <SingleCharacterTexture character="1" />,
    '/1.png',
    256,
  );
  await saveElementToDisk(
    <SingleCharacterTexture character="2" />,
    '/2.png',
    256,
  );
  await saveElementToDisk(
    <SingleCharacterTexture character="3" />,
    '/3.png',
    256,
  );
  await saveElementToDisk(
    <SingleCharacterTexture character="4" />,
    '/4.png',
    256,
  );
};
