import { GetStaticPaths, GetStaticProps } from 'next';
import { getPuzzleById, getPuzzles } from '../../lib/utils/reader';
import styled from '@emotion/styled';
import { Canvas } from '@react-three/fiber';
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
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  faBars,
  faCircleQuestion,
  faGear,
} from '@fortawesome/free-solid-svg-icons';
import tinycolor from 'tinycolor2';
import RotatingBox from '../../components/core/3d/Box';
import TurnArrow from '../../components/svg/TurnArrow';
import Logo from '../../components/svg/Logo';
import { useKeyDown } from '../../lib/utils/hooks/useKeyDown';
import { getCharacterRecord } from '../../lib/utils/puzzle';
import { useSpring } from '@react-spring/core';
import { easings } from '@react-spring/web';

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

const HeaderContainer = styled.div`
  position: relative;
  display: flex;
  padding: 1rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  max-width: var(--primary-app-width);
`;

const HeaderItem = styled.div`
  display: grid;
  grid-auto-flow: column;
  gap: 1rem;
  align-items: center;
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
  border-radius: 0.25rem;
  padding: 0.25rem 1rem;
  min-height: 55px;
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

const TurnArrowStyled = styled(TurnArrow)`
  margin-top: 5px;
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
  const [instancedRef, setInstancedMesh] = useState<InstancedMeshType | null>();
  const [cameraRef, setCameraRef] = useState<OrthographicCameraType>();
  const [selectedSide, setSelectedSide] = useState(0);
  const [keyAndIndexOverride, setKeyAndIndexOverride] =
    useState<[string, number]>();
  const [clue, setClue] = useState<string | undefined>();
  const [selectedCharacter, setSelectedCharacter] = useState<
    string | undefined
  >();

  const [isInitialized, setIsInitialized] = useState(false);
  const onInitialize = useCallback(() => {
    setIsInitialized(true);
  }, []);

  const scale = useMemo(() => {
    if (cameraRef == null || instancedRef == null || isInitialized === false) {
      return 1;
    }
    const { width } = getObjectSize(instancedRef, cameraRef);
    return (
      Math.min(window.innerWidth - 110, 650) /
      (width / Math.min(window.devicePixelRatio, 2)) // this is a weird bug where threejs was doubling the height on hidpi devices
    );
  }, [cameraRef, instancedRef, isInitialized]);

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

  const letterSelectedSide = useMemo(() => {
    return Math.abs(selectedSide % 4);
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

  // DEBUG FUNCTION
  // This will autocomplete the puzzle to test the success state
  const finishPuzzle = useCallback(() => {
    if (
      location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1'
    ) {
      const { solution } = getCharacterRecord(puzzleData);
      for (let x = 0; x < solution.length; x++) {
        const cell = solution[x];
        if (cell !== '#') {
          setTimeout(() => {
            setKeyAndIndexOverride([cell.value, x]);
          }, x * 15);
        }
      }
    }
  }, [puzzleData]);
  useKeyDown(finishPuzzle, ['~']);

  // Intro spinny animation
  const [rotation, setRotation] = useState(0);
  const { rotation: rotationAnimation } = useSpring({
    rotation: 1,
    config: {
      duration: 500,
      easing: easings.easeInBack,
    },
  });
  useEffect(() => {
    rotationAnimation.start({
      from: 0,
      to: 1,
      onChange: (props, spring) => {
        setRotation(spring.get());
      },
    });
  }, [rotationAnimation]);

  return (
    <Container>
      <HeaderContainer>
        <HeaderItem>
          <FontAwesomeIcon icon={faBars} width={25} />
          <Logo height={24} width={200} />
        </HeaderItem>
        <HeaderItem>
          <FontAwesomeIcon icon={faCircleQuestion} width={25} />
          <FontAwesomeIcon icon={faGear} width={25} />
        </HeaderItem>
      </HeaderContainer>
      <Canvas gl={{ antialias: false }}>
        <OrthographicCamera
          ref={setCameraRef}
          makeDefault
          zoom={50}
          near={1}
          far={2000}
          position={[0, -0.75, 100]}
        />
        <ambientLight />
        <pointLight position={[5, 5, 5]} intensity={1.5} />
        <PresentationControls
          global
          enabled={false}
          rotation={[0, rotation * (Math.PI + Math.PI * (selectedSide / 2)), 0]}
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
              keyAndIndexOverride={keyAndIndexOverride}
              currentKey={selectedCharacter}
              onLetterInput={onLetterInput}
              onSelectClue={setClue}
              defaultColor={defaultColor}
              selectedColor={selectedColor}
              adjacentColor={adjacentColor}
              onInitialize={onInitialize}
            />
          </group>
        </PresentationControls>
      </Canvas>
      <RotationContainer>
        <RotationButton color={defaultColor.toString(16)} onClick={turnLeft}>
          turn left
        </RotationButton>
        <RotationBoxContainer>
          <TurnArrowStyled
            color={`#${defaultColor.toString(16)}`}
            height={30}
            width={30}
          />
          <RotatingBox side={selectedSide} defaultColor={defaultColor} />
          <TurnArrowStyled
            color={`#${defaultColor.toString(16)}`}
            height={30}
            width={30}
            flipped
          />
        </RotationBoxContainer>
        <RotationButton color={defaultColor.toString(16)} onClick={turnRight}>
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
