import fs from 'fs';
import path from 'path';
import satori, { init } from 'satori';
import Yoga from 'yoga-wasm-web';
import { Resvg, ResvgRenderOptions } from '@resvg/resvg-js';

const characterItems: string[] = [];
for (let x = 0; x < 10; x++) {
  characterItems.push(x.toString(10));
}
for (let x = 0; x <= 25; x++) {
  characterItems.push(String.fromCharCode(65 + x));
}

const numberItems: string[] = [];
for (let x = 0; x <= 1000; x++) {
  numberItems.push(x.toString(10));
}

export const generateTextureRecord = (items = characterItems, size = 6) => {
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
      width: '341.33px',
      height: '341.33px',
      aspectRatio: '1',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Franklin Gothic',
      fontSize: '225px',
      color: 'white',
    }}
    key={item}
  >
    <div style={{ marginTop: '100px' }}>{item}</div>
  </div>
));

export const TextureAtlas: React.FC = () => (
  <div
    style={{
      display: 'flex',
      aspectRatio: '1',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '2048px', // 2k texture map
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

export const NUMBER_RECORD = generateTextureRecord(numberItems, 31);
const NUMBER_RECORD_ITEMS = Object.keys(NUMBER_RECORD).map((item: string) => (
  <div
    key={item}
    style={{
      display: 'flex',
      padding: '2px',
      width: '66.06px',
      height: '66.06px',
    }}
  >
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: '100%',
        aspectRatio: '1',
        fontFamily: 'Franklin Gothic',
        fontSize: '14px',
        color: 'white',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 5,
          left: 5,
        }}
      >
        {item}
      </div>
    </div>
  </div>
));

export const NumberAtlas: React.FC = () => (
  <div
    style={{
      display: 'flex',
      aspectRatio: '1',
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: '2048px', // 2k texture map
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
      {NUMBER_RECORD_ITEMS}
    </div>
  </div>
);

const publicDir = path.join(process.cwd(), 'public');
const nodeDir = path.join(process.cwd(), 'node_modules');

const saveElementToDisk = async (element: JSX.Element, filename: string) => {
  const font = fs.readFileSync(publicDir + '/franklin_gothic_regular.ttf');
  const wasm = fs.readFileSync(nodeDir + '/yoga-wasm-web/dist/yoga.wasm');
  // @ts-ignore
  const yoga = await Yoga(wasm);
  init(yoga);
  const svg = await satori(element, {
    width: 2048,
    height: 2048,
    fonts: [
      {
        name: 'Franklin Gothic',
        data: font as ArrayBuffer | Buffer,
        weight: 400,
        style: 'normal',
      },
    ],
  });

  const opts: ResvgRenderOptions = {
    background: 'rgba(0, 0, 0, 0)',
    fitTo: {
      mode: 'width',
      value: 2048,
    },
    font: {
      fontFiles: [nodeDir + '/public/franklin_gothic_regular.ttf'], // Load custom fonts.
      loadSystemFonts: false, // It will be faster to disable loading system fonts.
      defaultFontFamily: 'Franklin Gothic',
    },
  };
  const resvg = new Resvg(svg, opts);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  fs.writeFileSync(publicDir + filename, pngBuffer);
};

export const generateTextures = async () => {
  await saveElementToDisk(<TextureAtlas />, '/texture_atlas.png');
  await saveElementToDisk(<NumberAtlas />, '/number_atlas.png');
};
