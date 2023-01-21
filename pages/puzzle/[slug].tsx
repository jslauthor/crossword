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
import { generateTextures, TEXTURE_RECORD } from '../../lib/utils/textures';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
`;

type PuzzleProps = {
  puzzleData: PuzzleData[];
  characterTextureAtlasLookup: Record<string, [number, number]>;
};

export default function Puzzle({
  puzzleData,
  characterTextureAtlasLookup,
}: PuzzleProps) {
  const router = useRouter();
  // const { slug } = router.query;

  // TODO: Switch rendering to use the character record
  // TODO: Map correct cell numbers to cells (need to update data structure?)
  // TODO: Add cell selection with bg color change
  // TODO: When selecting a cell, change bg for all letters in word
  // TODO: Create separate answer record and show in grid on letter
  // TODO: Create buttons to orient to a new face
  // TODO: Change color when changing sides
  // TODO: When selecting a cell, change the color of its word
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
          <group position={[-4, -4, 4]}>
            <LetterBoxes
              puzzleData={puzzleData}
              characterTextureAtlasLookup={characterTextureAtlasLookup}
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
  return {
    props: { puzzleData, characterTextureAtlasLookup },
  };
};

export { getStaticProps, getStaticPaths };
