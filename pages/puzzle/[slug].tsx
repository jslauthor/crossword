import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPuzzleById, getPuzzles } from '../../lib/utils/reader';
import styled from '@emotion/styled';
import { Canvas } from '@react-three/fiber';
import { useElementSize } from 'usehooks-ts';
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
import { useMemo, useState } from 'react';
import type {
  OrthographicCamera as OrthographicCameraType,
  InstancedMesh as InstancedMeshType,
} from 'three';
import { getObjectSize } from '../../lib/utils/three';

const ButtonContainer = styled.div`
  position: absolute;
  display: flex;
  top: 0px;
  right: 0px;
`;

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  touch-action: none;
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
  const [instancedRef, setInstancedMesh] = useState<InstancedMeshType | null>();
  const [cameraRef, setCameraRef] = useState<OrthographicCameraType>();
  const [selectedSide, setSelectedSide] = useState(2);
  const [containerRef, { width, height }] = useElementSize();

  const scale = useMemo(() => {
    if (cameraRef == null || instancedRef == null) {
      return 1;
    }
    const { width } = getObjectSize(instancedRef, cameraRef);
    return Math.min(window.innerWidth - 100, 500) / width;
  }, [cameraRef, instancedRef]);

  // TODO: Add swipe gesture to change sides
  // TODO: Lock camera when playing to front view only
  // TODO: Run on vercel to test on phone
  // TODO: Add cool flippy animations
  // TODO: Add a keyboard: https://www.npmjs.com/package/react-simple-keyboard
  // TODO: Change color when changing sides?
  // TODO: Make this multiplayer where different people can work on different sides?
  // TODO: Add top and bottom sides?
  // TODO: When you complete a side, animate it and change the color

  return (
    <Container ref={containerRef}>
      <Canvas>
        <OrthographicCamera
          ref={setCameraRef}
          makeDefault
          zoom={50}
          near={1}
          far={2000}
          position={[0, 0, 200]}
        />
        <ambientLight />
        <pointLight position={[5, 5, 5]} intensity={1.5} />
        <PresentationControls
          global
          enabled={false}
          rotation={[0, Math.PI * (selectedSide / 2), 0]}
        >
          <group
            position={[-3.5 * scale, -5, 3.5 * scale]}
            scale={[scale, scale, scale]}
          >
            <LetterBoxes
              setInstancedMesh={setInstancedMesh}
              puzzleData={puzzleData}
              characterTextureAtlasLookup={characterTextureAtlasLookup}
              cellNumberTextureAtlasLookup={cellNumberTextureAtlasLookup}
              // Subtracting 2 to match the puzzle's selected cell side algorithm
              selectedSide={Math.abs((selectedSide - 2) % 4)}
            />
          </group>
        </PresentationControls>
      </Canvas>
      <Stats />
      <ButtonContainer>
        <button onClick={() => setSelectedSide(selectedSide + 1)}>&lt;</button>
        <button onClick={() => setSelectedSide(selectedSide - 1)}>&gt;</button>
      </ButtonContainer>
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
