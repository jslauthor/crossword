import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPuzzleById, getPuzzles } from '../../lib/utils/reader';
import styled from '@emotion/styled';
import { Canvas } from '@react-three/fiber';
import {
  PresentationControls,
  OrthographicCamera,
  Stats,
} from '@react-three/drei';
import LetterBoxes from '../../components/core/3d/Box';
import { PuzzleData } from '../../types/types';
import {
  generateTextures,
  NUMBER_RECORD,
  TEXTURE_RECORD,
} from '../../lib/utils/textures';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
`;

type PuzzleProps = {
  puzzleData: PuzzleData[];
  characterTextureAtlasLookup: Record<string, [number, number]>;
  cellNumberTextureAtlasLookup: Record<string, [number, number]>;
};

export default function Puzzle({
  puzzleData,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
}: PuzzleProps) {
  const router = useRouter();

  // TODO: Add cell selection with bg color change
  // TODO: When selecting a cell, change bg for all letters in word
  // TODO: Create buttons to orient to a new side
  // TODO: Change color when changing sides
  // TODO: Add a keyboard: https://www.npmjs.com/package/react-simple-keyboard
  // TODO: Make this multiplayer where different people can work on different sides?
  // TODO: Add top and bottom sides?
  // TODO: When you complete a side, animate it and change the color

  return (
    <Container>
      <Canvas>
        <OrthographicCamera
          makeDefault
          zoom={50}
          near={1}
          far={2000}
          position={[0, 0, 200]}
        />
        <ambientLight />
        <pointLight position={[5, 5, 5]} />
        <PresentationControls global>
          <group position={[-3.5, -3.5, 3.5]}>
            <LetterBoxes
              puzzleData={puzzleData}
              characterTextureAtlasLookup={characterTextureAtlasLookup}
              cellNumberTextureAtlasLookup={cellNumberTextureAtlasLookup}
            />
          </group>
        </PresentationControls>
      </Canvas>
      <Stats />
    </Container>
  );
}

const getStaticPaths: GetStaticPaths = async () => {
  const paths = (await getPuzzles()).map((fileName) => ({
    params: {
      slug: fileName,
    },
  }));
  return {
    paths,
    fallback: true,
  };
};

const getStaticProps: GetStaticProps<PuzzleProps, { slug: string }> = async ({
  params,
}) => {
  await generateTextures();

  const puzzleData = await getPuzzleById(params?.slug ?? '');
  const characterTextureAtlasLookup = TEXTURE_RECORD;
  const cellNumberTextureAtlasLookup = NUMBER_RECORD;
  return {
    props: {
      puzzleData,
      characterTextureAtlasLookup,
      cellNumberTextureAtlasLookup,
    },
  };
};

export { getStaticProps, getStaticPaths };
