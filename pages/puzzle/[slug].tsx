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
import { useCallback, useMemo, useState } from 'react';
import type {
  OrthographicCamera as OrthographicCameraType,
  InstancedMesh as InstancedMeshType,
} from 'three';
import { getObjectSize } from '../../lib/utils/three';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

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
  display: flex;
  flex-direction: column;
`;

const KeyboardContainer = styled.div`
  width: 100%;
  height: max-content;
  position: relative;
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
  const [selectedCharacter, setSelectedCharacter] = useState<
    string | undefined
  >();

  const scale = useMemo(() => {
    if (cameraRef == null || instancedRef == null) {
      return 1;
    }
    const { width } = getObjectSize(instancedRef, cameraRef);
    return Math.min(window.innerWidth - 100, 550) / width;
  }, [cameraRef, instancedRef]);

  const onKeyPress = useCallback((button: string) => {
    if (button != 'MORE') {
      setSelectedCharacter(button === '{bksp}' ? '' : button);
    }
  }, []);

  // When the letter changes inside of the LetterBoxes
  // we want to reset the selected character so that
  // it doesn't apply to other cells
  const onLetterInput = useCallback(() => {
    setSelectedCharacter(undefined);
  }, []);

  // TODO: Add clues
  // TODO: Add swipe gesture to change sides
  // TODO: Run on vercel to test on phone
  // TODO: Add cool flippy animations
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
            position={[-3.5 * scale, -4, 3.5 * scale]}
            scale={[scale, scale, scale]}
          >
            <LetterBoxes
              setInstancedMesh={setInstancedMesh}
              puzzleData={puzzleData}
              characterTextureAtlasLookup={characterTextureAtlasLookup}
              cellNumberTextureAtlasLookup={cellNumberTextureAtlasLookup}
              // Subtracting 2 to match the puzzle's selected cell side algorithm
              selectedSide={Math.abs((selectedSide - 2) % 4)}
              currentKey={selectedCharacter}
              onLetterInput={onLetterInput}
            />
          </group>
        </PresentationControls>
      </Canvas>
      <KeyboardContainer>
        <Keyboard
          layoutName="default"
          theme="hg-theme-default keyboardTheme"
          onKeyPress={onKeyPress}
          mergeDisplay
          display={{
            '{bksp}': '⌫',
            '{sp}': ' ',
          }}
          buttonTheme={[
            {
              class: 'more-button',
              buttons: 'MORE',
            },
            {
              class: 'spacer-button',
              buttons: '{sp}',
            },
          ]}
          layout={{
            default: [
              'Q W E R T Y U I O P',
              '{sp} A S D F G H J K L {sp}',
              'MORE Z X C V B N M {bksp}',
            ],
            more: [
              '~ ! @ # $ % ^ &amp; * ( ) _ + {bksp}',
              '{tab} Q W E R T Y U I O P { } |',
              '{lock} A S D F G H J K L : " {enter}',
              '{shift} Z X C V B N M &lt; &gt; ? {shift}',
              '.com @ {space}',
            ],
          }}
        />
      </KeyboardContainer>
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
