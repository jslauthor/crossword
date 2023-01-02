import fs from 'fs';
import path from 'path';
import satori, { init } from 'satori';
import Yoga from 'yoga-wasm-web';
import { svg2png, initialize } from 'svg2png-wasm';

let isSvgToPngInitialized = false;

const generateTextureRecord = () => {
  const items: string[] = [];
  for (let x = 0; x <= 25; x++) {
    items.push(String.fromCharCode(65 + x));
  }
  for (let x = 0; x < 10; x++) {
    items.push(x.toString(10));
  }

  // It's a 6x6 grid that contains A-Z and 0-9 (36 total items)
  let position = 0;
  const grid: Record<string, [number, number]> = {};
  for (let x = 0; x < 6; x++) {
    for (let y = 0; y < 6; y++) {
      grid[items[position]] = [x, y];
      position += 1;
    }
  }

  return grid;
};

const TEXTURE_RECORD = generateTextureRecord();
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
      fontSize: '320px',
      color: 'white',
    }}
    key={item}
  >
    {item}
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

const publicDir = path.join(process.cwd(), 'public');
const nodeDir = path.join(process.cwd(), 'node_modules');

export const generateTextures = async () => {
  const font = fs.readFileSync(publicDir + '/franklin_gothic_regular.ttf');
  const wasm = fs.readFileSync(nodeDir + '/yoga-wasm-web/dist/yoga.wasm');

  // @ts-ignore
  const yoga = await Yoga(wasm);
  init(yoga);
  const svg = await satori(<TextureAtlas />, {
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

  if (isSvgToPngInitialized === false) {
    await initialize(
      fs.readFileSync(nodeDir + '/svg2png-wasm/svg2png_wasm_bg.wasm')
    );
    isSvgToPngInitialized = true;
  }

  const png = await svg2png(svg, {
    // scale: 2, // optional
    width: 2048, // optional
    height: 2048, // optional
    fonts: [
      // optional
      font, // require, If you use text in svg
    ],
    defaultFontFamily: {
      // optional
      sansSerifFamily: 'Franklin Gothic',
    },
  });

  fs.writeFileSync(publicDir + '/texture_atlas.png', png);
};
