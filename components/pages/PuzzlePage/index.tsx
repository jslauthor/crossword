'use client';

import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import {
  Bloom,
  EffectComposer,
  ChromaticAberration,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Stats, PerspectiveCamera } from '@react-three/drei';
import LetterBoxes from 'components/core/3d/LetterBoxes';
import { PuzzleData } from 'types/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PerspectiveCamera as PerspectiveCameraType,
  InstancedMesh as InstancedMeshType,
  Box3,
  Vector3,
  Vector2,
} from 'three';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faCircleQuestion,
  faGear,
  faClose,
} from '@fortawesome/free-solid-svg-icons';
import useDimensions from 'react-cool-dimensions';
import RotatingBox from 'components/core/3d/Box';
import Logo from 'components/svg/Logo';
import { useKeyDown } from 'lib/utils/hooks/useKeyDown';
import { getCharacterRecord } from 'lib/utils/puzzle';
import { useSpring } from '@react-spring/core';
import { easings } from '@react-spring/web';
import tinycolor from 'tinycolor2';
import ExampleCube from 'components/svg/ExampleCube';
import TurnArrow from 'components/svg/TurnArrow';
import { SwipeControls } from 'components/core/3d/SwipeControls';
import { rangeOperation } from 'lib/utils/math';
import { useAnimatedText } from 'lib/utils/hooks/useAnimatedText';
import Particles from 'components/core/3d/Particles';
import Sparks from 'components/core/3d/Sparks';
import { useElapsedTime } from 'use-elapsed-time';
import localforage from 'localforage';
import useAsyncQueue from 'lib/utils/hooks/useAsyncQueue';
import MenuWrapper from 'components/core/MenuWrapper';

const SUPPORTED_KEYBOARD_CHARACTERS: string[] = [];
for (let x = 0; x < 10; x++) {
  SUPPORTED_KEYBOARD_CHARACTERS.push(x.toString(10));
}
for (let x = 0; x <= 25; x++) {
  SUPPORTED_KEYBOARD_CHARACTERS.push(String.fromCharCode(65 + x));
}
for (let x = 0; x <= 1000; x++) {
  SUPPORTED_KEYBOARD_CHARACTERS.push(x.toString(10));
}
SUPPORTED_KEYBOARD_CHARACTERS.push('BACKSPACE');

export const DEFAULT_COLOR = 0x708d91;
export const DEFAULT_SELECTED_COLOR = 0xd31996;
export const DEFAULT_SELECTED_ADJACENT_COLOR = 0x1fbe68;

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

const SolvedContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  inset: 0;
  background: radial-gradient(rgb(0, 0, 0, 0.7), rgb(0, 0, 0, 0));
  font-weight: 600;
  font-size: 1.5rem;
  color: var(--primary-text);
  max-width: var(--primary-app-width);
  margin: 0 auto;
`;

const SolvedText = styled.div`
  font-weight: 400;
  font-size: 0.75rem;
  font-style: italic;
  margin-top: 0.5rem;
`;

const SolvedTime = styled.h3`
  font-weight: 400;
  font-size: 2rem;
`;

const TurnButton = styled.div<{ $borderColor: string }>`
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  border-style: solid;
  border-width: 1px;
  ${({ $borderColor }) =>
    `border-color: #${tinycolor($borderColor).darken(5).toHex()};`}
`;

const InfoBar = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  grid-column-gap: 0.5rem;
  max-width: var(--primary-app-width);
  width: 100%;
  height: min-content;
  margin-bottom: 0.125rem;
`;

const ClueContainer = styled.div<{ $backgroundColor: string }>`
  display: grid;
  // grid-template-columns: min-content 1fr min-content;
  grid-template-columns: 1fr;
  grid-column-gap: 1rem;
  align-items: center;
  border-radius: 0.25rem;
  padding: 0 0.5rem;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  min-height: 54px;
  ${({ $backgroundColor }) =>
    `background-color: #${tinycolor($backgroundColor).darken(5).toHex()}`}
`;

const ClueLabel = styled.span<{ celebrate?: boolean }>`
  font-size: 1rem;
  line-height: 1rem !important;
  ${({ celebrate }) =>
    celebrate && 'text-align: center; font-size: 1.5rem; font-weight: 600;'}
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

type ElapsedTimeProps = {
  slug: string;
  isPaused: boolean;
};

type PuzzleProps = {
  puzzleData: PuzzleData[];
  characterTextureAtlasLookup: Record<string, [number, number]>;
  cellNumberTextureAtlasLookup: Record<string, [number, number]>;
  slug: string;
};

export default function Puzzle({
  puzzleData,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
  slug,
}: PuzzleProps) {
  const [instancedRef, setInstancedMesh] = useState<InstancedMeshType | null>();
  const [cameraRef, setCameraRef] = useState<PerspectiveCameraType | null>();
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
  const [scale, setScale] = useState(1);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const toggleModal = useCallback(() => {
    setShowHelpModal(!showHelpModal);
  }, [showHelpModal]);

  const [isVerticalOrientation, setVerticalOrientation] =
    useState<boolean>(false);

  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const animatedClueText = useAnimatedText(clue, 120);

  const [puzzleWidth] = useMemo(() => {
    if (puzzleData == null || puzzleData.length < 1) {
      return [8]; // default to 8
    }
    let { width, height } = puzzleData[0].dimensions;
    const totalPerSide = width * height;
    return [width, height, totalPerSide];
  }, [puzzleData]);

  useEffect(() => {
    if (cameraRef == null || instancedRef == null || isInitialized === false) {
      return;
    }
    const size = new Vector3();
    new Box3().setFromObject(instancedRef).getSize(size);
    size.project(cameraRef);
    size.multiplyScalar(window.innerWidth);

    const { x: width } = size;
    const newScale =
      Math.min(Math.min(window.innerWidth * 0.95, 500), canvasHeight * 0.95) /
      Math.abs(width);
    cameraRef.lookAt(instancedRef.position);
    setScale(newScale);
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
          }, x * 30);
        }
      }
    }
  }, [puzzleData]);

  const onKeyPress = useCallback(
    (button: string) => {
      switch (button) {
        case '{tl}':
          turnLeft();
          break;
        case '{tr}':
          turnRight();
          break;
        case 'MORE':
          finishPuzzle();
          break;
        default:
          if (button !== 'MORE' && isPuzzleSolved === false) {
            setSelectedCharacter(button === '{bksp}' ? '' : button);
          }
      }
    },
    [finishPuzzle, isPuzzleSolved, turnLeft, turnRight]
  );

  const onSolved = useCallback(() => {
    setIsPuzzleSolved(true);
  }, []);

  // When the letter changes inside of the LetterBoxes
  // we want to reset the selected character so that
  // it doesn't apply to other cells
  const onLetterInput = useCallback(() => {
    setSelectedCharacter(undefined);
  }, []);

  const onLetterChange = useCallback(
    (key: string) => {
      if (isPuzzleSolved === false) {
        setSelectedCharacter(key);
      }
    },
    [isPuzzleSolved]
  );
  useKeyDown(onLetterChange, SUPPORTED_KEYBOARD_CHARACTERS);

  const defaultColor = useMemo(() => DEFAULT_COLOR, []);
  const selectedColor = useMemo(() => DEFAULT_SELECTED_COLOR, []);
  const adjacentColor = useMemo(() => DEFAULT_SELECTED_ADJACENT_COLOR, []);

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

  const mouse = useRef([0, 0]);
  const toHex = useCallback(
    (color: number) => `#${color.toString(16).padStart(6, '0')}`,
    []
  );
  const sparkColors = useMemo(
    () => [
      tinycolor(toHex(defaultColor)).brighten(10).toHexString(),
      tinycolor(toHex(selectedColor)).brighten(10).toHexString(),
      tinycolor(toHex(adjacentColor)).brighten(10).toHexString(),
    ],
    [adjacentColor, defaultColor, selectedColor, toHex]
  );
  const abberationOffset = useMemo(() => new Vector2(0.0005, 0.0005), []);

  const onClueClick = useCallback(() => {
    setVerticalOrientation(!isVerticalOrientation);
  }, [isVerticalOrientation]);

  const { add } = useAsyncQueue({ concurrency: 1 });

  const [shouldStartTimer, setShouldStartTimer] = useState<boolean>(false);
  const elapsedTimeStorageKey = useMemo(() => `puzzle-${slug}-time`, [slug]);

  const { elapsedTime, reset } = useElapsedTime({
    isPlaying:
      shouldStartTimer === true &&
      (typeof window === 'undefined' ? false : !document.hidden) &&
      (isPuzzleSolved || !isInitialized) === false,
    updateInterval: 1,
    onUpdate: (elapsedTime) => {
      add({
        id: elapsedTimeStorageKey,
        task: () => localforage.setItem(elapsedTimeStorageKey, elapsedTime),
      });
    },
  });

  useEffect(() => {
    const getTime = async () => {
      const storedTime = await localforage.getItem(elapsedTimeStorageKey);
      setShouldStartTimer(true);
      reset(Number(storedTime ?? 0));
    };
    getTime();
  }, [elapsedTimeStorageKey, reset]);

  const formattedElapsedTime = useMemo(
    () =>
      elapsedTime < 3600
        ? new Date(elapsedTime * 1000).toISOString().slice(14, 19)
        : new Date(elapsedTime * 1000).toISOString().slice(11, 19),
    [elapsedTime]
  );

  return (
    <MenuWrapper centerLabel={formattedElapsedTime}>
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
          position={[0, 0, 3.35]}
        />
        <ambientLight intensity={5} />
        <pointLight position={[0, 0, -2]} intensity={2} />
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
              id={slug}
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
              onSolved={onSolved}
              isVerticalOrientation={isVerticalOrientation}
              onVerticalOrientationChange={setVerticalOrientation}
            />
          </group>
        </SwipeControls>
        {isPuzzleSolved === true && (
          <>
            <Sparks
              count={12}
              mouse={mouse}
              radius={1.5}
              colors={sparkColors}
            />
            <Particles count={2500} mouse={mouse} />
          </>
        )}
        <EffectComposer>
          <Bloom
            luminanceThreshold={1}
            luminanceSmoothing={2}
            height={canvasHeight}
          />
          <ChromaticAberration
            radialModulation={false}
            modulationOffset={0}
            blendFunction={BlendFunction.NORMAL} // blend mode
            offset={abberationOffset} // color offset
          />
        </EffectComposer>
      </Canvas>
      <InfoBar>
        <TurnButton onClick={turnLeft} $borderColor={toHex(defaultColor)}>
          <TurnArrow width={20} height={20} color={toHex(defaultColor)} />
        </TurnButton>
        <ClueContainer
          $backgroundColor={toHex(adjacentColor)}
          onClick={onClueClick}
        >
          {/* <FontAwesomeIcon icon={faChevronLeft} width={12} /> */}
          <ClueLabel dangerouslySetInnerHTML={{ __html: animatedClueText }} />
          {/* <FontAwesomeIcon icon={faChevronRight} width={12} /> */}
        </ClueContainer>
        <TurnButton onClick={turnRight} $borderColor={toHex(defaultColor)}>
          <TurnArrow
            width={20}
            height={20}
            flipped
            color={toHex(defaultColor)}
          />
        </TurnButton>
      </InfoBar>
      <KeyboardContainer>
        {isPuzzleSolved && (
          <SolvedContainer>
            <div>🏆 YOU DID IT! 🏆</div>
            <SolvedText>You finished the puzzle in</SolvedText>
            <SolvedTime>
              <HeaderItem>{formattedElapsedTime}</HeaderItem>
            </SolvedTime>
          </SolvedContainer>
        )}
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
              '{sp} A S D F G H J K L {sp}',
              'MORE Z X C V B N M {bksp}',
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
    </MenuWrapper>
  );
}
