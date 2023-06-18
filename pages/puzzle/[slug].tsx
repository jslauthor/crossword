import { GetStaticPaths, GetStaticProps } from 'next';
import { getPuzzleById, getPuzzles } from '../../lib/utils/reader';
import styled from '@emotion/styled';
import { Canvas } from '@react-three/fiber';
import {
  PresentationControls,
  Stats,
  PerspectiveCamera,
} from '@react-three/drei';
import LetterBoxes from '../../components/core/3d/LetterBoxes';
import { PuzzleData } from '../../types/types';
import {
  generateTextures,
  NUMBER_RECORD,
  TEXTURE_RECORD,
} from '../../lib/utils/textures';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  OrthographicCamera as OrthographicCameraType,
  InstancedMesh as InstancedMeshType,
  Box3,
  Vector3,
} from 'three';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faBars,
  faCircleQuestion,
  faGear,
  faClose,
} from '@fortawesome/free-solid-svg-icons';
import useDimensions from 'react-cool-dimensions';
import RotatingBox from '../../components/core/3d/Box';
import Logo from '../../components/svg/Logo';
import { useKeyDown } from '../../lib/utils/hooks/useKeyDown';
import { getCharacterRecord } from '../../lib/utils/puzzle';
import { useSpring } from '@react-spring/core';
import { easings } from '@react-spring/web';
import tinycolor from 'tinycolor2';
import ExampleCube from '../../components/svg/ExampleCube';
import TurnArrow from '../../components/svg/TurnArrow';
import { SwipeControls } from '../../components/core/3d/SwipeControls';
import { rangeOperation } from '../../lib/utils/math';

const DEFAULT_COLOR = 0x708d91;
const DEFAULT_SELECTED_COLOR = 0xd31996;
const DEFAULT_SELECTED_ADJACENT_COLOR = 0x1fbe68;

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  user-select: none;
`;

const HeaderContainer = styled.div`
  position: relative;
  display: flex;
  padding: 0.25rem 0.5rem;
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
  grid-template-columns: 1fr;
  grid-column-gap: 1rem;
  align-items: center;
  border-radius: 0.25rem;
  padding: 0 0.5rem;
  max-height: 44px;
  height: 100%;
  box-sizing: border-box;
  margin-bottom: 0.125rem;
  max-width: var(--primary-app-width);
  width: 100%;
  ${({ backgroundColor }) =>
    `background-color: #${tinycolor(backgroundColor).darken(5).toHex()}`}
`;

const ClueLabel = styled.span`
  font-size: 1rem;
  line-height: 1rem !important;
`;

const ModalContainer = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  inset: 0;
  background: rgb(0, 0, 0, 0.3);
`;

const Center = styled.div`
  padding-top: 1rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  position: relative;
  display: grid;
  grid-auto-flow: row;
  gap: 0.75rem;
  margin: 1rem;
  padding: 1rem;
  padding-top: 3rem;
  background: var(--secondary-bg);
  border-radius: 0.5rem;
  max-width: var(--primary-app-width);
  width: 100%;
`;

const CornerLabel = styled.span`
  color: #7dc69c;
  font-weight: 500;
`;

const SwipeLabel = styled.p`
  font-style: italic;
`;

const TurnArrowContainer = styled.span`
  display: inline-block;
  margin-right: 0.25rem;
`;

const TurnArrowStyled = styled(TurnArrow)`
  margin-bottom: -10px;
`;

const UlStyled = styled.ul`
  list-style: disc;
  padding-left: 0.75rem;
`;

const HRule = styled.div`
  height: 1px;
  background: var(--primary-text);
  opacity: 0.25;
  width: 100%;
`;

const CloseModalContainer = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
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
  const [sideOffset, setSideOffset] = useState(0);
  const [keyAndIndexOverride, setKeyAndIndexOverride] =
    useState<[string, number]>();
  const [clue, setClue] = useState<string | undefined>();
  const [selectedCharacter, setSelectedCharacter] = useState<
    string | undefined
  >();
  const { observe: containerRef, height: canvasHeight } =
    useDimensions<HTMLCanvasElement>();
  const [isInitialized, setIsInitialized] = useState(false);
  const onInitialize = useCallback(() => {
    setIsInitialized(true);
  }, []);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const toggleModal = useCallback(() => {
    setShowHelpModal(!showHelpModal);
  }, [showHelpModal]);

  const [puzzleWidth] = useMemo(() => {
    if (puzzleData == null || puzzleData.length < 1) {
      return [8]; // default to 8
    }
    let { width, height } = puzzleData[0].dimensions;
    const totalPerSide = width * height;
    return [width, height, totalPerSide];
  }, [puzzleData]);

  const scale = useMemo(() => {
    if (cameraRef == null || instancedRef == null || isInitialized === false) {
      return 1;
    }

    const size = new Vector3();
    new Box3().setFromObject(instancedRef).getSize(size);
    size.project(cameraRef);
    size.multiplyScalar(window.innerWidth).multiplyScalar(puzzleWidth);

    const { x: width } = size;
    const newScale =
      Math.min(Math.min(window.innerWidth * 0.95, 500), canvasHeight * 0.95) /
      width;
    cameraRef.lookAt(instancedRef.position);
    return newScale * 1.75;
  }, [cameraRef, canvasHeight, instancedRef, isInitialized, puzzleWidth]);

  const turnLeft = useCallback(
    () => setSideOffset(sideOffset + 1),
    [sideOffset]
  );
  const turnRight = useCallback(
    () => setSideOffset(sideOffset - 1),
    [sideOffset]
  );

  const selectedSide = useMemo(() => {
    return rangeOperation(0, 3, 0, -sideOffset);
  }, [sideOffset]);

  const onKeyPress = useCallback(
    (button: string) => {
      switch (button) {
        case '{tl}':
          turnLeft();
          break;
        case '{tr}':
          turnRight();
          break;
        default:
          console.log(button);
          if (button !== 'MORE') {
            setSelectedCharacter(button === '{bksp}' ? '' : button);
          }
      }
    },
    [turnLeft, turnRight]
  );

  // When the letter changes inside of the LetterBoxes
  // we want to reset the selected character so that
  // it doesn't apply to other cells
  const onLetterInput = useCallback(() => {
    setSelectedCharacter(undefined);
  }, []);

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
          <FontAwesomeIcon icon={faBars} width={20} />
          <Logo height={18} width={150} />
        </HeaderItem>
        <HeaderItem>
          <RotatingBox side={sideOffset} defaultColor={defaultColor} />
          <FontAwesomeIcon
            icon={faCircleQuestion}
            width={20}
            onClick={toggleModal}
          />
          <FontAwesomeIcon icon={faGear} width={20} />
        </HeaderItem>
      </HeaderContainer>
      <Canvas
        gl={{ antialias: false }}
        style={{
          height: '50vh',
          aspectRatio: 1,
          touchAction: 'none',
        }}
        ref={containerRef}
      >
        <PerspectiveCamera
          ref={setCameraRef}
          makeDefault
          fov={45}
          position={[0, 0, 6]}
        />
        <ambientLight />
        <pointLight position={[5, 5, 5]} intensity={1.5} />
        <SwipeControls
          global
          dragEnabled={false}
          onSwipeLeft={turnLeft}
          onSwipeRight={turnRight}
          rotation={[0, rotation * (Math.PI + Math.PI * (sideOffset / 2)), 0]}
        >
          <group
            position={[-3.5 * scale, -3.5 * scale, 3.5 * scale]}
            scale={[scale, scale, scale]}
          >
            <LetterBoxes
              setInstancedMesh={setInstancedMesh}
              puzzleData={puzzleData}
              characterTextureAtlasLookup={characterTextureAtlasLookup}
              cellNumberTextureAtlasLookup={cellNumberTextureAtlasLookup}
              selectedSide={selectedSide}
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
        </SwipeControls>
      </Canvas>
      <ClueContainer backgroundColor={adjacentColor.toString(16)}>
        {/* <FontAwesomeIcon icon={faChevronLeft} width={12} /> */}
        <ClueLabel dangerouslySetInnerHTML={{ __html: clue ?? '&nbsp;' }} />
        {/* <FontAwesomeIcon icon={faChevronRight} width={12} /> */}
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
            '{tl}': '<<<',
            '{tr}': '>>>',
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
            {
              class: 'turn-left-button',
              buttons: '{tl}',
            },
            {
              class: 'turn-right-button',
              buttons: '{tr}',
            },
          ]}
          layout={{
            default: [
              'Q W E R T Y U I O P',
              '{tl} A S D F G H J K L {tr}',
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

      {/** Modal content below */}
      {showHelpModal && (
        <ModalContainer>
          <ModalContent>
            <CloseModalContainer onClick={toggleModal}>
              <FontAwesomeIcon icon={faClose} size="xl" />
            </CloseModalContainer>
            <h1>How to play Crosscube</h1>
            <h2>An 8x8 crossword in 3 dimensions</h2>
            <Center>
              <ExampleCube height={125} width={225} />
            </Center>
            <UlStyled>
              <li>There are four sides.</li>
              <li>
                <CornerLabel>Corners</CornerLabel> share the same letter.
              </li>
              <li>
                Change sides with the{' '}
                <TurnArrowContainer>
                  <TurnArrowStyled
                    color="#999999"
                    flipped
                    height={25}
                    width={25}
                  />{' '}
                </TurnArrowContainer>
                keys.
                <SwipeLabel>(or swipe)</SwipeLabel>
              </li>
              <li>Solve all of the clues to win!</li>
            </UlStyled>
            <HRule />
            <h2>Sign up or Log in to save your progress. (coming soon)</h2>
          </ModalContent>
        </ModalContainer>
      )}
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
