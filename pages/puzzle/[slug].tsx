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
import LetterBoxes from '../../components/core/3d/LetterBoxes';
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import tinycolor from 'tinycolor2';
import RotatingBox from '../../components/core/3d/Box';
import TurnArrow from '../../components/svg/TurnArrow';

const DEFAULT_COLOR = 0x708d91;
const DEFAULT_SELECTED_COLOR = 0xd31996;
const DEFAULT_SELECTED_ADJACENT_COLOR = 0x19dd89;

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  touch-action: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  user-select: none;
`;

const KeyboardContainer = styled.div`
  width: 100%;
  height: max-content;
  position: relative;
`;

const ClueContainer = styled.div<{ backgroundColor: string }>`
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  grid-column-gap: 1rem;
  align-items: center;
  height: 100px;
  border-radius: 0.25rem;
  padding: 0rem 1rem;
  box-sizing: border-box;
  margin-bottom: 0.5rem;
  max-width: var(--primary-app-width);
  width: 100%;
  ${({ backgroundColor }) => `background-color: #${backgroundColor}`}
`;

const ClueLabel = styled.span`
  font-size: 1.25rem;
`;

const RotationBoxContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const RotationContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content 1fr;
  grid-column-gap: 1rem;
  margin: 0.75rem 0;
  max-width: var(--primary-app-width);
  width: 100%;
`;

const RotationButton = styled.div<{ color: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background: transparent;
  border-radius: 0.25rem;
  border: 1px solid #${({ color }) => color};
  color: ${({ color }) => tinycolor(`#${color}`).brighten(30).toHexString()};
  padding: 0.5rem 0.25rem;
  text-align: center;
  min-width: 100px;
  margin: 0 auto;
  font-weight: 500;
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
  const [clue, setClue] = useState<string | undefined>();
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

  // TODO: Add swipe gesture to change sides
  // TODO: Run on vercel to test on phone
  // TODO: Add cool flippy animations
  // TODO: Change color when changing sides?
  // TODO: Make this multiplayer where different people can work on different sides?
  // TODO: Add top and bottom sides?
  // TODO: When you complete a side, animate it and change the color

  const letterSelectedSide = useMemo(() => {
    const side = selectedSide % 4;
    // We need to flip the even sides to match the component's algorithm
    return side % 2 === 0 ? Math.abs(side - 2) : side;
  }, [selectedSide]);

  const turnLeft = useCallback(
    () => setSelectedSide(selectedSide + 1),
    [selectedSide]
  );
  const turnRight = useCallback(
    () => setSelectedSide(selectedSide - 1),
    [selectedSide]
  );

  const defaultColor = useMemo(() => DEFAULT_COLOR, []);
  const selectedColor = useMemo(() => DEFAULT_SELECTED_COLOR, []);
  const adjacentColor = useMemo(() => DEFAULT_SELECTED_ADJACENT_COLOR, []);

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
              selectedSide={letterSelectedSide}
              currentKey={selectedCharacter}
              onLetterInput={onLetterInput}
              onSelectClue={setClue}
              defaultColor={defaultColor}
              selectedColor={selectedColor}
              adjacentColor={adjacentColor}
            />
          </group>
        </PresentationControls>
      </Canvas>
      <RotationContainer>
        <RotationButton color={defaultColor.toString(16)} onClick={turnRight}>
          turn left
        </RotationButton>
        <RotationBoxContainer>
          <TurnArrow
            color={`#${defaultColor.toString(16)}`}
            height={30}
            width={30}
          />
          <RotatingBox side={selectedSide} defaultColor={0x677275} />
          <TurnArrow
            color={`#${defaultColor.toString(16)}`}
            height={30}
            width={30}
            flipped
          />
        </RotationBoxContainer>
        <RotationButton color={defaultColor.toString(16)} onClick={turnLeft}>
          turn right
        </RotationButton>
      </RotationContainer>
      <ClueContainer backgroundColor={adjacentColor.toString(16)}>
        <FontAwesomeIcon icon={faChevronLeft} width={12} />
        <ClueLabel dangerouslySetInnerHTML={{ __html: clue ?? '&nbsp;' }} />
        <FontAwesomeIcon icon={faChevronRight} width={12} />
      </ClueContainer>
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
      {/* <Stats /> */}
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
