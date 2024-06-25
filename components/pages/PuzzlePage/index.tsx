'use client';

import React, { MouseEvent } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { Stats, PerspectiveCamera, Html } from '@react-three/drei';
import LetterBoxes, { SelectClueFn } from 'components/core/3d/LetterBoxes';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PerspectiveCamera as PerspectiveCameraType,
  Vector3,
  Object3D,
} from 'three';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import useDimensions from 'react-cool-dimensions';
import { useKeyDown } from 'lib/utils/hooks/useKeyDown';
import { useSpring } from '@react-spring/core';
import { easings } from '@react-spring/web';
import tinycolor from 'tinycolor2';
import TurnArrow from 'components/svg/TurnArrow';
import { SwipeControls } from 'components/core/3d/SwipeControls';
import { rangeOperation } from 'lib/utils/math';
import { useAnimatedText } from 'lib/utils/hooks/useAnimatedText';
import Particles from 'components/core/3d/Particles';
import Sparks from 'components/core/3d/Sparks';
import { useElapsedTime } from 'use-elapsed-time';
import Menu from 'components/containers/Menu';
import { RotatingBoxProps } from 'components/core/3d/Box';
import { usePuzzleProgress } from 'lib/utils/hooks/usePuzzleProgress';
import { fitCameraToCenteredObject } from 'lib/utils/three';
import { createInitialState } from 'lib/utils/puzzle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronCircleDown,
  faChevronCircleRight,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from 'lib/utils/hooks/theme';
import { VRule } from 'components/core/Dividers';
import PuzzleSettings from 'components/composed/PuzzleSettings';
import { Spinner } from 'components/core/ui/spinner';
import useSvgAtlas from 'lib/utils/hooks/useSvgAtlas';
import { PuzzleProps } from 'app/puzzle/[slug]/page';

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

type KeyboardLayoutType = Record<'default' | 'emoji', string[]>;
type CssMapType = Record<string, [string, string]>;

const HeaderItem = styled.div`
  display: grid;
  grid-auto-flow: column;
  gap: 1rem;
  align-items: center;
`;

const KeyboardContainer = styled.div<{ $svgCssMap?: CssMapType }>`
  width: 100%;
  height: max-content;
  position: relative;

  ${({ $svgCssMap }) => {
    if ($svgCssMap) {
      return Object.entries($svgCssMap).map(([key, [, data]]) => {
        return `

          .${key} {
            span {
              font-size: 0;
            }
            &::before {
              content: url('${data}');
              display: block;
              width: 30px;
              height: 30px;
              @media (max-width: 400px) {
                width: 20px;
                height: 20px;
              }
            }
          }

        `;
      });
    }
  }}
`;

const SolvedContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  inset: 0;
  background: radial-gradient(hsl(var(--background)), rgb(0, 0, 0, 0));
  font-weight: 600;
  font-size: 1.5rem;
  color: hsl(var(--foreground));
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

const TurnButton = styled.div<{ $side: 'left' | 'right'; $color: string }>`
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $color }) =>
    `background-color: #${tinycolor($color).darken(15).toHex()};`}
  ${({ $side }) => {
    if ($side === 'left') {
      return 'border-right: none; border-radius: 0.25rem 0 0 0.25rem;';
    } else {
      return 'border-left: none; border-radius: 0 0.25rem 0.25rem 0;';
    }
  }}
`;

const InfoBar = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  max-width: var(--primary-app-width);
  width: 100%;
  height: min-content;
  margin-bottom: 0.125rem;
`;

const ClueContainer = styled.div<{ $backgroundColor: string }>`
  position: relative;
  display: grid;
  user-select: none;
  grid-template-columns: 1fr 0.15fr;
  grid-column-gap: 0.5rem;
  align-items: center;
  padding: 0 0.5rem;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  min-height: 54px;
  overflow: hidden;
  color: hsl(var(--foreground));
  ${({ $backgroundColor }) =>
    `background-color: #${tinycolor($backgroundColor).darken(5).toHex()}`}
`;

const ClueLabel = styled.span<{ celebrate?: boolean }>`
  font-size: 0.85rem;
  line-height: 1rem !important;
  user-select: none;
  ${({ celebrate }) =>
    celebrate && 'text-align: center; font-size: 1.5rem; font-weight: 600;'}
`;

const ClueTextContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.15rem;
`;

const BackNextButtonsContainer = styled.div<{ $backgroundColor: string }>`
  position: relative;
  display: flex;
  right: -0.5rem;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  cursor: pointer;
`;

const SelectedInfo = styled.span<{ $backgroundColor: string }>`
  font-weight: 600;
  gap: 0.25rem;
  line-height: 1.25;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  width: fit-content;
  padding: 0 0.15rem;
  border-radius: 0.25rem;
  user-select: none;
  ${({ $backgroundColor }) =>
    `background-color: #${tinycolor($backgroundColor).toHex()}`}
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

function Loader() {
  return (
    <Html center>
      <Spinner show />
    </Html>
  );
}

export default function Puzzle({
  puzzle,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
}: PuzzleProps) {
  const { theme } = useTheme();
  const layout = useMemo<keyof KeyboardLayoutType>(
    () => (puzzle.svgsegments != null ? 'emoji' : 'default'),
    [puzzle.svgsegments],
  );
  const [svgCssMap, setSvgCssMap] = useState<CssMapType>({});

  const {
    svgTextureAtlas,
    svgTextureAtlasLookup,
    svgGridSize,
    progress,
    svgContentMap,
  } = useSvgAtlas(puzzle.svgsegments);

  const [groupRef, setGroup] = useState<Object3D | null>();
  const [cameraRef, setCameraRef] = useState<PerspectiveCameraType | null>();
  const [sideOffset, setSideOffset] = useState(0);
  const [keyAndIndexOverride, setKeyAndIndexOverride] =
    useState<[string, number]>();
  const [clue, setClue] = useState<string | undefined>();
  const [cellNumber, setCellNumber] = useState<number | undefined>();
  const [selected, setSelected] = useState<number | undefined>();
  const [selectedCharacter, setSelectedCharacter] = useState<
    string | undefined
  >();
  const {
    observe: containerRef,
    height: canvasHeight,
    width: canvasWidth,
  } = useDimensions<HTMLCanvasElement>();

  const [isPuzzleReady, setPuzzleReady] = useState(false);
  const onInitialize = useCallback(() => {
    setPuzzleReady(true);
  }, []);
  const isInitialized = useMemo(() => {
    return isPuzzleReady && progress >= 1;
  }, [isPuzzleReady, progress]);

  const onPrevWord =
    useRef<
      (selected: number, startFromBeginning?: boolean) => void | undefined
    >();
  const onNextWord = useRef<(selected: number) => void | undefined>();

  const [isVerticalOrientation, setVerticalOrientation] =
    useState<boolean>(false);

  const animatedClueText = useAnimatedText(clue, 60);

  const [puzzleWidth] = useMemo(() => {
    if (puzzle == null || puzzle.data.length < 1) {
      return [8]; // default to 8
    }
    let { width, height } = puzzle.data[0].dimensions;
    const totalPerSide = width * height;
    return [width, height, totalPerSide];
  }, [puzzle]);

  const handleClueChange = useCallback<SelectClueFn>(
    (clue, cellNumber, selected) => {
      setClue(clue);
      setCellNumber(cellNumber);
      setSelected(selected);
    },
    [],
  );

  useEffect(() => {
    if (cameraRef == null || groupRef == null || isInitialized === false) {
      return undefined;
    }

    fitCameraToCenteredObject(
      cameraRef,
      groupRef,
      new Vector3(puzzleWidth, puzzleWidth, puzzleWidth),
      1.02,
    );
  }, [
    cameraRef,
    groupRef,
    puzzleWidth,
    canvasHeight,
    canvasWidth,
    isInitialized,
  ]);

  const groupRefPosition: Vector3 = useMemo(() => {
    const multiplier = (puzzleWidth - 1) / 2;
    return new Vector3(-multiplier, -multiplier, multiplier);
  }, [puzzleWidth]);

  const {
    isPuzzleSolved,
    addTime,
    elapsedTime,
    updateCharacterPosition,
    characterPositions,
    validations,
    draftModes,
    autoNextEnabled,
    addAutoNextEnabled,
    autocheckEnabled,
    addAutocheckEnabled,
    draftModeEnabled,
    addDraftModeEnabled,
    hasRetrievedState,
  } = usePuzzleProgress(
    puzzle,
    svgTextureAtlasLookup ?? characterTextureAtlasLookup,
    isInitialized === true,
  );
  const turnLeft = useCallback(
    () => setSideOffset(sideOffset + 1),
    [sideOffset],
  );
  const turnRight = useCallback(
    () => setSideOffset(sideOffset - 1),
    [sideOffset],
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
      const { solution } = puzzle.record;
      for (let x = 0; x < solution.length; x++) {
        const { value: cell } = solution[x];
        if (cell !== '#') {
          setTimeout(() => {
            setKeyAndIndexOverride([cell.value, x]);
          }, x * 30);
        }
      }
    }
  }, [puzzle]);

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
    [isPuzzleSolved],
  );

  const {
    colors: {
      font: fontColor,
      fontDraft: fontDraftColor,
      default: defaultColor,
      selected: selectedColor,
      selectedAdjacent: adjacentColor,
      correct: correctColor,
      error: errorColor,
      border: borderColor,
      turnArrow: turnArrowColor,
    },
  } = useTheme();

  // Track rotation so we can update the shader in letterboxes
  const [isSpinning, setIsSpinning] = useState(false);
  const updateRotationProgress = useCallback((progress: number) => {
    // So, this is kind of weird
    // We only want isSpinning to be true in a more limited range because we want to hide the
    // side faces when the animation is mostly complete (not fully) to prevent flickering
    setIsSpinning(progress <= 0.98);
  }, []);

  // Intro spinny animation
  const [rotation, setRotation] = useState(0);
  const { rotation: introAnimation } = useSpring({
    rotation: 1,
    config: {
      duration: 500,
      easing: easings.easeInBack,
    },
  });
  useEffect(() => {
    introAnimation.start({
      from: 0,
      to: 1,
      onChange: (props, spring) => {
        setRotation(spring.get());
      },
    });
  }, [introAnimation]);

  const mouse = useRef([0, 0]);
  const toHex = useCallback(
    (color: number) => `#${color.toString(16).padStart(6, '0')}`,
    [],
  );
  const sparkColors = useMemo(
    () => [
      tinycolor(toHex(defaultColor)).brighten(10).toHexString(),
      tinycolor(toHex(selectedColor)).brighten(10).toHexString(),
      tinycolor(toHex(adjacentColor)).brighten(10).toHexString(),
    ],
    [adjacentColor, defaultColor, selectedColor, toHex],
  );

  const onClueClick = useCallback(() => {
    setVerticalOrientation(!isVerticalOrientation);
  }, [isVerticalOrientation]);

  const [shouldStartTimer, setShouldStartTimer] = useState<boolean>(false);

  const { reset } = useElapsedTime({
    isPlaying:
      shouldStartTimer === true &&
      hasRetrievedState === true &&
      (typeof window === 'undefined' ? false : !document.hidden) &&
      (isPuzzleSolved || !isInitialized) === false,
    updateInterval: 1,
    onUpdate: (elapsedTime) => {
      // console.log('Elapsed time:', elapsedTime);
      addTime(elapsedTime);
    },
  });

  useEffect(() => {
    if (hasRetrievedState === true && shouldStartTimer === false) {
      reset(Number(elapsedTime ?? 0));
      setShouldStartTimer(true);
    }
  }, [elapsedTime, hasRetrievedState, reset, shouldStartTimer]);

  // TODO: Convert into separate component
  const formattedElapsedTime = useMemo(
    () =>
      (elapsedTime ?? 0) < 3600
        ? new Date((elapsedTime ?? 0) * 1000).toISOString().slice(14, 19)
        : new Date((elapsedTime ?? 0) * 1000).toISOString().slice(11, 19),
    [elapsedTime],
  );

  const rotatingBoxProps: RotatingBoxProps = useMemo(() => {
    return {
      color: selectedColor,
      textColor: fontColor,
      side: sideOffset,
    };
  }, [fontColor, selectedColor, sideOffset]);

  const handleAutocheckChanged = useCallback(
    (autocheckEnabled: boolean) => {
      addAutocheckEnabled(autocheckEnabled);
    },
    [addAutocheckEnabled],
  );

  const handleDraftModeChanged = useCallback(
    (draftModeEnabled: boolean) => {
      addDraftModeEnabled(draftModeEnabled);
    },
    [addDraftModeEnabled],
  );

  /**
   * setState did not work for this callback, so I used a reference instead. Very odd.
   */
  const setOnNextWord = useCallback((s: (selected: number) => void) => {
    onNextWord.current = s;
  }, []);

  const setOnPrevWord = useCallback((s: (selected: number) => void) => {
    onPrevWord.current = s;
  }, []);

  const handlePrevWord = useCallback(
    (selected?: number) => (event?: MouseEvent) => {
      if (event) event.stopPropagation();
      if (onPrevWord.current == null || selected == null) return;
      onPrevWord.current(selected, true);
    },
    [],
  );

  const handleNextWord = useCallback(
    (selected?: number) => (event?: MouseEvent) => {
      if (event) event.stopPropagation();
      if (onNextWord.current == null || selected == null) return;
      onNextWord.current(selected);
    },
    [],
  );

  const {
    characterPositions: defaultCharacterPositions,
    draftModes: defaultDraftModes,
    validations: defaultValidations,
  } = useMemo(() => {
    return createInitialState(puzzle);
  }, [puzzle]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const handleSettingsPressed = useCallback(() => {
    setIsSettingsOpen(!isSettingsOpen);
  }, [isSettingsOpen]);
  const handleSettingsClose = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleNext = useCallback(
    () => handleNextWord(selected)(undefined),
    [handleNextWord, selected],
  );
  const handlePrev = useCallback(
    () => handlePrevWord(selected)(undefined),
    [handlePrevWord, selected],
  );

  // Keyboard shortcuts
  useKeyDown(onLetterChange, SUPPORTED_KEYBOARD_CHARACTERS);
  useKeyDown(handlePrev, ['ARROWLEFT']);
  useKeyDown(handleNext, ['ARROWRIGHT']);
  useKeyDown(turnRight, ['ARROWUP']);
  useKeyDown(turnLeft, ['ARROWDOWN']);
  useKeyDown(onClueClick, [' ']);
  useKeyDown(finishPuzzle, ['`']);

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
          if (button !== 'MORE' && isPuzzleSolved === false) {
            setSelectedCharacter(button === '{bksp}' ? '' : button);
          }
      }
    },
    [isPuzzleSolved, turnLeft, turnRight],
  );

  // Keyboard mappings
  const displayKeyMap = useMemo(() => {
    return {
      '{bksp}': '⌫',
      '{sp}': ' ',
      '{tl}': '<<<',
      '{tr}': '>>>',
      MORE: ' ',
    };
  }, []);

  const buttonTheme = useMemo(() => {
    const cssMap = Object.keys(svgContentMap).reduce((acc, key, index) => {
      const svgBase64 = svgContentMap[key];
      if (svgBase64 == null) {
        return acc;
      } else {
        acc[`svg-${index}`] = [key, svgBase64];
      }
      return acc;
    }, {} as CssMapType);
    setSvgCssMap(cssMap);
    return [
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
      {
        class: 'backspace-button',
        buttons: '{bksp}',
      },
      ...Object.entries(cssMap).map(([key, value]) => ({
        class: key,
        buttons: value[0],
      })),
    ];
  }, [svgContentMap]);

  const keyLayout: KeyboardLayoutType = useMemo(() => {
    const emojiKeys = Object.keys(svgContentMap);
    return {
      default: [
        'Q W E R T Y U I O P',
        '{sp} A S D F G H J K L {sp}',
        'MORE Z X C V B N M {bksp}',
      ],
      emoji: [
        `${emojiKeys.slice(0, 10).join(' ')}`,
        `{sp} ${emojiKeys.slice(9, 18).join(' ')} {sp}`,
        `MORE ${emojiKeys.slice(17, 24).join(' ')} {bksp}`,
      ],
    };
  }, [svgContentMap]);

  return (
    <>
      <Menu
        centerLabel={formattedElapsedTime}
        rotatingBoxProps={rotatingBoxProps}
        autocheckEnabled={autocheckEnabled}
        draftModeEnabled={draftModeEnabled}
        onAutocheckChanged={handleAutocheckChanged}
        onDraftModeChanged={handleDraftModeChanged}
        onSettingsPressed={handleSettingsPressed}
      >
        <Canvas
          gl={{ antialias: false }}
          style={{
            touchAction: 'none',
          }}
          ref={containerRef}
        >
          <Suspense fallback={<Loader />}>
            <PerspectiveCamera
              ref={setCameraRef}
              makeDefault
              position={[0, 0, 0]}
            />
            <ambientLight intensity={3} />
            {/* <pointLight position={[0, 0, -2]} intensity={2} /> */}
            <SwipeControls
              global
              dragEnabled={false}
              onSwipeLeft={turnLeft}
              onSwipeRight={turnRight}
              rotation={[
                0,
                rotation * (Math.PI + Math.PI * (sideOffset / 2)),
                0,
              ]}
              onRotationYProgress={updateRotationProgress}
            >
              <group ref={setGroup} position={groupRefPosition}>
                <LetterBoxes
                  puzzle={puzzle}
                  svgTextureAtlas={svgTextureAtlas}
                  svgTextureAtlasLookup={svgTextureAtlasLookup}
                  svgGridSize={svgGridSize}
                  characterTextureAtlasLookup={characterTextureAtlasLookup}
                  cellNumberTextureAtlasLookup={cellNumberTextureAtlasLookup}
                  selectedSide={selectedSide}
                  keyAndIndexOverride={keyAndIndexOverride}
                  currentKey={selectedCharacter}
                  updateCharacterPosition={updateCharacterPosition}
                  onLetterInput={onLetterInput}
                  onSelectClue={handleClueChange}
                  fontColor={fontColor}
                  fontDraftColor={fontDraftColor}
                  defaultColor={defaultColor}
                  selectedColor={selectedColor}
                  adjacentColor={adjacentColor}
                  errorColor={errorColor}
                  correctColor={correctColor}
                  borderColor={borderColor}
                  onInitialize={onInitialize}
                  isVerticalOrientation={isVerticalOrientation}
                  onVerticalOrientationChange={setVerticalOrientation}
                  autocheckEnabled={autocheckEnabled}
                  characterPositionArray={
                    characterPositions ?? defaultCharacterPositions
                  }
                  cellValidationArray={validations ?? defaultValidations}
                  cellDraftModeArray={draftModes ?? defaultDraftModes}
                  autoNextEnabled={autoNextEnabled}
                  turnLeft={turnLeft}
                  turnRight={turnRight}
                  setOnNextWord={setOnNextWord}
                  setOnPrevWord={setOnPrevWord}
                  theme={theme}
                  isSpinning={isSpinning}
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
          </Suspense>
        </Canvas>
        {isInitialized === true && (
          <>
            <InfoBar>
              <TurnButton
                onClick={turnLeft}
                $side="left"
                $color={toHex(adjacentColor)}
              >
                <TurnArrow
                  width={20}
                  height={20}
                  color={toHex(turnArrowColor)}
                />
              </TurnButton>
              <ClueContainer
                $backgroundColor={toHex(adjacentColor)}
                onClick={onClueClick}
              >
                <ClueTextContainer>
                  {cellNumber != null && (
                    <SelectedInfo $backgroundColor={toHex(selectedColor)}>
                      {`${cellNumber}`}
                      {isVerticalOrientation ? (
                        <FontAwesomeIcon
                          icon={faChevronCircleDown}
                          width={10}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faChevronCircleRight}
                          width={10}
                        />
                      )}
                    </SelectedInfo>
                  )}
                  &nbsp;
                  <ClueLabel
                    dangerouslySetInnerHTML={{ __html: animatedClueText }}
                  />{' '}
                </ClueTextContainer>
                <BackNextButtonsContainer
                  $backgroundColor={toHex(adjacentColor)}
                >
                  <IconContainer onClick={handlePrevWord(selected)}>
                    <FontAwesomeIcon icon={faChevronLeft} width={20} />
                  </IconContainer>
                  <VRule />
                  <IconContainer onClick={handleNextWord(selected)}>
                    <FontAwesomeIcon icon={faChevronRight} width={20} />
                  </IconContainer>
                </BackNextButtonsContainer>
              </ClueContainer>
              <TurnButton
                onClick={turnRight}
                $side="right"
                $color={toHex(adjacentColor)}
              >
                <TurnArrow
                  width={20}
                  height={20}
                  flipped
                  color={toHex(turnArrowColor)}
                />
              </TurnButton>
            </InfoBar>
            <KeyboardContainer $svgCssMap={svgCssMap}>
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
                layoutName={layout}
                theme="hg-theme-default keyboardTheme"
                onKeyPress={onKeyPress}
                mergeDisplay
                display={displayKeyMap}
                buttonTheme={buttonTheme}
                layout={keyLayout}
              />
            </KeyboardContainer>
          </>
        )}
        {/* <Stats /> */}
      </Menu>
      <PuzzleSettings
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
        autoNextEnabled={autoNextEnabled}
        onAutoNextChanged={addAutoNextEnabled}
      />
    </>
  );
}
