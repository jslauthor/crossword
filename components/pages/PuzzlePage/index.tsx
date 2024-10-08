'use client';

import React, { MouseEvent } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { Stats, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import LetterBoxes from 'components/core/3d/LetterBoxes';
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
  Color,
  InstancedMesh,
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
import Sparks from 'components/core/3d/Sparks';
import { useElapsedTime } from 'use-elapsed-time';
import Menu from 'components/containers/Menu';
import { RotatingBoxProps } from 'components/core/3d/Box';
import { usePuzzleProgress } from 'lib/utils/hooks/usePuzzleProgress';
import { fitCameraToCenteredObject } from 'lib/utils/three';
import {
  createInitialState,
  getBlanksForIds,
  getPuzzleLabel,
  getRangeForCell,
  getType,
  isCellWithNumber,
  isSingleCell,
} from 'lib/utils/puzzle';
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
import TimerAndGuesses from 'components/composed/Timer';
import PuzzleShare from 'components/composed/PuzzleShare';
import ShareButton from 'components/core/ShareButton';
import PuzzlePrompt from 'components/composed/PuzzlePrompt';
import { useRouter } from 'next/navigation';
import { usePageVisibility } from 'lib/utils/hooks/usePageVisibility';
import posthog from 'posthog-js';

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
              aspect-ratio: 1;
              width: 92%;
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
  gap: 1rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  inset: 0;
  background: radial-gradient(hsl(var(--background)), rgb(0, 0, 0, 0));
  font-weight: 600;
  font-size: 1.5rem;
  font-style: italic;
  color: hsl(var(--foreground));
  max-width: var(--primary-app-width);
  margin: 0 auto;
`;

const TurnButton = styled.div<{ $color: string }>`
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $color }) =>
    `background-color: #${tinycolor($color).darken(15).toHex()};`}
`;

const InfoBarWrapper = styled.div`
  max-width: var(--primary-app-width);
  width: 100%;
  margin-bottom: 0.125rem;
`;

const InfoBar = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  width: 100%;
  height: min-content;
  border-radius: 0.25rem;
  overflow: hidden;
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

const BackNextButtonsContainer = styled.div`
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

const noop = () => {};

export default function Puzzle({
  puzzle,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
}: PuzzleProps) {
  const [width, rowLength] = useMemo(() => {
    let { width } = puzzle.data[0].dimensions;
    return [width, width * puzzle.data.length - puzzle.data.length];
  }, [puzzle.data]);

  const isSingleSided = useMemo(() => {
    for (let j = 0; j < puzzle.record.solution.length; j++) {
      const { value: cell } = puzzle.record.solution[j];
      const side = Math.floor((j % rowLength) / width);
      if (cell !== '#' && side > 0) {
        return false;
      }
    }
    return true;
  }, [puzzle.record.solution, rowLength, width]);

  const router = useRouter();
  const { theme } = useTheme();
  const layout = useMemo<keyof KeyboardLayoutType>(
    () => (puzzle.svgSegments != null ? 'emoji' : 'default'),
    [puzzle.svgSegments],
  );
  const [svgCssMap, setSvgCssMap] = useState<CssMapType>({});

  const {
    svgTextureAtlas,
    svgTextureAtlasLookup,
    svgGridSize,
    progress,
    svgContentMap,
    error: svgError,
  } = useSvgAtlas(puzzle.svgSegments);

  useEffect(() => {
    if (svgError === true) {
      console.error('Failed to load emojis in the SVG texture atlas!');
      posthog.capture('puzzle_svg_error', { puzzleId: puzzle.id });
    }
  }, [puzzle.id, svgError]);

  const [groupRef, setGroup] = useState<Object3D | null>();
  const [cameraRef, setCameraRef] = useState<PerspectiveCameraType | null>();
  const [sideOffset, setSideOffset] = useState(0);
  const [keyAndIndexOverride, setKeyAndIndexOverride] =
    useState<[string, number]>();
  const [clue, setClue] = useState<string | undefined>();
  const [cellNumber, setCellNumber] = useState<number | undefined>();
  const [selected, setSelected] = useState<InstancedMesh['id'] | undefined>(0);
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

  const goToNextWord =
    useRef<(selected: number, polarity: 1 | -1) => void | undefined>();

  const [isVerticalOrientation, setVerticalOrientation] =
    useState<boolean>(false);

  const selectedSide = useMemo(() => {
    return rangeOperation(0, 3, 0, -sideOffset);
  }, [sideOffset]);

  const [isSelectedSingleCell, setIsSelectedSingleCell] =
    useState<boolean>(false);

  // Update the clue and cell number when the selected cell changes
  useEffect(() => {
    if (selected == null) {
      setClue(undefined);
      setCellNumber(undefined);
    } else {
      const range = getRangeForCell(
        puzzle,
        selected,
        selectedSide,
        isVerticalOrientation,
      );
      if (range.length > 0) {
        const {
          clues: { across, down },
          solution,
        } = puzzle.record;
        const clues =
          isSelectedSingleCell || isVerticalOrientation === false
            ? across
            : down;
        // Select the clue. It will always be the first cell in the sequence
        const rootWord = solution[range[0]];
        if (
          isCellWithNumber(rootWord.value) &&
          typeof rootWord.value.cell === 'number'
        ) {
          const { cell: cellNumber } = rootWord.value;
          setCellNumber(cellNumber);
          setClue(clues.find((c) => c.number === cellNumber)?.clue);
        }
      }
    }
  }, [
    isSelectedSingleCell,
    isVerticalOrientation,
    puzzle,
    selected,
    selectedSide,
  ]);

  const [puzzleWidth] = useMemo(() => {
    if (puzzle == null || puzzle.data.length < 1) {
      return [8]; // default to 8
    }
    let { width, height } = puzzle.data[0].dimensions;
    const totalPerSide = width * height;
    return [width, height, totalPerSide];
  }, [puzzle]);

  const groupRefPosition: Vector3 = useMemo(() => {
    const multiplier = (puzzleWidth - 1) / 2;
    return new Vector3(-multiplier, -multiplier, multiplier);
  }, [puzzleWidth]);

  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const {
    hasInteractedWithPuzzle,
    isPuzzleSolved,
    addTime,
    elapsedTime,
    guesses,
    puzzleStats,
    updateCharacterPosition,
    characterPositions,
    validations,
    draftModes,
    autoNextEnabled,
    addAutoNextEnabled,
    autoCheckEnabled,
    addAutocheckEnabled,
    addSelectNextBlankEnabled,
    selectNextBlankEnabled: selectNextBlankStored,
    draftModeEnabled,
    addDraftModeEnabled,
    hasRetrievedState,
    handleDontShowTryAgain,
  } = usePuzzleProgress(
    puzzle,
    puzzle.svgSegments ? svgTextureAtlasLookup : characterTextureAtlasLookup,
    isInitialized === true,
    setIsPromptOpen,
  );

  const isSingleSidedEmojiPuzzle = useMemo(() => {
    return isSingleSided === true && svgTextureAtlas != null;
  }, [isSingleSided, svgTextureAtlas]);

  const handleSetOrientation = useCallback(
    (
      orientation: boolean,
      id: InstancedMesh['id'] | undefined = selected,
      isSingle: boolean = isSelectedSingleCell,
    ) => {
      if (id == null || isSingle === true) return;
      const range = getRangeForCell(puzzle, id, selectedSide, orientation);
      if (range.length > 1) {
        setVerticalOrientation(orientation);
      }
    },
    [isSelectedSingleCell, puzzle, selected, selectedSide],
  );

  const handleSelectedChange = useCallback(
    (id: InstancedMesh['id'] | undefined, source?: 'keyboard' | 'mouse') => {
      setSelected(id);
      if (
        source === 'keyboard' ||
        id == null ||
        isSingleSidedEmojiPuzzle === false
      )
        return;

      const isSingle = isSingleCell(puzzle, id, selectedSide);
      setIsSelectedSingleCell(isSingle);
      if (isSingle === true) return;

      const verticalRange = getRangeForCell(puzzle, id, selectedSide, true);
      const horizontalRange = getRangeForCell(puzzle, id, selectedSide, false);
      const cell = puzzle.record.solution[id];
      if (isCellWithNumber(cell.value)) {
        const hasVertical = verticalRange.length > 1 && verticalRange[0] === id;
        const hasHorizontal =
          horizontalRange.length > 1 && horizontalRange[0] === id;

        // If both directions have multiple cells, prefer the one with blanks
        if (hasVertical === true && hasHorizontal === true) {
          if (getBlanksForIds(verticalRange, characterPositions).length > 0) {
            handleSetOrientation(true, id, false);
          } else {
            handleSetOrientation(false, id, false);
          }
        } else if (hasVertical === true) {
          handleSetOrientation(true, id, false);
        } else if (hasHorizontal === true) {
          handleSetOrientation(false, id, false);
        }
      } else if (
        isVerticalOrientation === true &&
        verticalRange.length < 2 &&
        horizontalRange.length > 1
      ) {
        handleSetOrientation(false, id, isSingle);
      } else if (
        isVerticalOrientation === false &&
        horizontalRange.length < 2 &&
        verticalRange.length > 1
      ) {
        handleSetOrientation(true, id, isSingle);
      }
    },
    [
      characterPositions,
      handleSetOrientation,
      isSingleSidedEmojiPuzzle,
      isVerticalOrientation,
      puzzle,
      selectedSide,
    ],
  );

  const animatedClueText = useAnimatedText(clue, 60);

  const [fogNear, setFogNear] = useState(0);
  const [fogFar, setFogFar] = useState(100);
  const [objectDepth, setsetObjectDepth] = useState(0);

  useEffect(() => {
    if (cameraRef == null || groupRef == null || isInitialized === false) {
      return undefined;
    }

    const { boundingBox, cameraZ } = fitCameraToCenteredObject(
      cameraRef,
      groupRef,
      new Vector3(puzzleWidth, puzzleWidth, puzzleWidth),
      1.02,
    );

    const objectDepth = boundingBox.max.z - boundingBox.min.z;
    const fogNearDistance = (cameraZ - objectDepth / 2) * 1.02;
    const fogFarDistance = (cameraZ + objectDepth / 2) * 1.02;

    setsetObjectDepth(objectDepth);
    setFogNear(fogNearDistance);
    setFogFar(fogFarDistance);
  }, [
    cameraRef,
    groupRef,
    puzzleWidth,
    canvasHeight,
    canvasWidth,
    isInitialized,
  ]);

  const disableNextBlankEnabled = useMemo(() => {
    return isSingleSidedEmojiPuzzle === true;
  }, [isSingleSidedEmojiPuzzle]);

  const selectNextBlankEnabled = useMemo(() => {
    return disableNextBlankEnabled === false && selectNextBlankStored;
  }, [disableNextBlankEnabled, selectNextBlankStored]);

  const [_, api] = useSpring(() => ({
    singleSidedOffset: 0,
  }));
  const turnAnimationPlaying = useRef(false);

  const turnLeft = useCallback(
    (offset?: number) => {
      if (turnAnimationPlaying.current === true) return;
      if (isSingleSided === true) {
        api.start({
          config: {
            duration: 30,
          },
          from: { singleSidedOffset: sideOffset },
          to: [
            { singleSidedOffset: sideOffset + 0.2 },
            { singleSidedOffset: sideOffset },
          ],
          onResolve: ({ finished }) => {
            if (finished === true) {
              turnAnimationPlaying.current = false;
            }
          },
          onChange: (_, spring) => {
            turnAnimationPlaying.current = true;
            setSideOffset(spring.get().singleSidedOffset);
          },
        });
        return;
      }
      setSideOffset(sideOffset + (offset ?? 1));
    },
    [api, isSingleSided, sideOffset],
  );
  const turnRight = useCallback(
    (offset?: number) => {
      if (turnAnimationPlaying.current === true) return;
      if (isSingleSided === true) {
        api.start({
          config: {
            duration: 30,
          },
          from: { singleSidedOffset: sideOffset },
          to: [
            { singleSidedOffset: sideOffset - 0.2 },
            { singleSidedOffset: sideOffset },
          ],
          onResolve: ({ finished }) => {
            if (finished === true) {
              turnAnimationPlaying.current = false;
            }
          },
          onChange: (_, spring) => {
            turnAnimationPlaying.current = true;
            setSideOffset(spring.get().singleSidedOffset);
          },
        });
        return;
      }
      setSideOffset(sideOffset - (offset ?? 1));
    },
    [api, isSingleSided, sideOffset],
  );

  // DEBUG FUNCTION
  // This will autocomplete the puzzle to test the success state
  const finishPuzzle = useCallback(() => {
    if (
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'development' ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
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

  const animationStarted = useRef(false);
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
    if (canvasWidth != null && animationStarted.current === false) {
      animationStarted.current = true;
      introAnimation.start({
        from: 0,
        to: 1,
        onChange: (props, spring) => {
          setRotation(spring.get());
        },
      });
    }
  }, [canvasWidth, introAnimation]);

  const mouse = useRef([100, 3]);
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
    handleSetOrientation(!isVerticalOrientation);
  }, [handleSetOrientation, isVerticalOrientation]);

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
  const setGoToNextWord = useCallback(
    (s: (selected: number, polarity: 1 | -1) => void) => {
      goToNextWord.current = s;
    },
    [],
  );

  const handlePrevWord = useCallback(
    (selected?: number) => (event?: MouseEvent) => {
      if (event) event.stopPropagation();
      if (goToNextWord.current == null || selected == null) return;
      goToNextWord.current(selected, -1);
    },
    [],
  );

  const handleNextWord = useCallback(
    (selected?: number) => (event?: MouseEvent) => {
      if (event) event.stopPropagation();
      if (goToNextWord.current == null || selected == null) return;
      goToNextWord.current(selected, 1);
    },
    [],
  );

  const handleRightButtonClick = useCallback(
    () => (isSingleSided ? handleNextWord(selected)() : turnRight()),
    [isSingleSided, handleNextWord, selected, turnRight],
  );
  const handleLeftButtonClick = useCallback(
    () => (isSingleSided ? handlePrevWord(selected)() : turnLeft()),
    [isSingleSided, handlePrevWord, selected, turnLeft],
  );

  const {
    characterPositions: defaultCharacterPositions,
    draftModes: defaultDraftModes,
    validations: defaultValidations,
  } = useMemo(() => {
    return createInitialState(puzzle);
  }, [puzzle]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const handleSettingsPressed = useCallback(() => {
    setIsSettingsOpen(!isSettingsOpen);
  }, [isSettingsOpen]);
  const handleSettingsClose = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);
  const handleSharePressed = useCallback(() => {
    setIsShareOpen(true);
  }, []);
  const handleShareClose = useCallback(() => {
    setIsShareOpen(false);
  }, []);

  // Update page title with puzzle title
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.title = `${puzzle.title} - Crosscube`;
  }, [puzzle.title]);

  const isVisible = usePageVisibility();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shouldStartTimer, setShouldStartTimer] = useState<boolean>(false);
  const puzzleIsActive = useMemo(
    () =>
      isVisible === true &&
      (isPuzzleSolved || !isInitialized) === false &&
      shouldStartTimer === true &&
      hasRetrievedState === true &&
      isSettingsOpen === false &&
      isMenuOpen === false &&
      isPromptOpen === false,
    [
      isVisible,
      hasRetrievedState,
      isInitialized,
      isMenuOpen,
      isPuzzleSolved,
      isSettingsOpen,
      shouldStartTimer,
      isPromptOpen,
    ],
  );

  const { reset } = useElapsedTime({
    isPlaying: puzzleIsActive,
    updateInterval: 1,
    onUpdate: (time) => {
      if (elapsedTime != null && elapsedTime > time) {
        reset(elapsedTime);
      } else {
        addTime(time);
      }
    },
  });

  useEffect(() => {
    if (hasRetrievedState === true && shouldStartTimer === false) {
      reset(Number(elapsedTime ?? 0));
      setShouldStartTimer(true);
    }
  }, [elapsedTime, hasRetrievedState, reset, shouldStartTimer]);

  // Keyboard shortcuts
  useKeyDown(onLetterChange, SUPPORTED_KEYBOARD_CHARACTERS);
  useKeyDown(() => handlePrevWord(selected)(), ['ARROWLEFT']);
  useKeyDown(() => handleNextWord(selected)(), ['ARROWRIGHT']);
  useKeyDown(() => handleNextWord(selected)(), ['TAB'], true, false, true);
  useKeyDown(isSingleSided ? noop : handleRightButtonClick, ['ARROWUP']);
  useKeyDown(isSingleSided ? noop : handleLeftButtonClick, ['ARROWDOWN']);
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
    const emojiKeys = Object.keys(svgContentMap).sort();
    return {
      default: [
        'Q W E R T Y U I O P',
        '{sp} A S D F G H J K L {sp}',
        'MORE Z X C V B N M {bksp}',
      ],
      emoji: [
        `${emojiKeys.slice(0, 9).join(' ')}`,
        `${emojiKeys.slice(9, 18).join(' ')}`,
        `${emojiKeys.slice(18, 26).join(' ')} {bksp}`,
      ],
    };
  }, [svgContentMap]);

  useEffect(() => {
    if (isPuzzleSolved === true && hasInteractedWithPuzzle === true) {
      setIsShareOpen(true);
    }
  }, [isPuzzleSolved, hasInteractedWithPuzzle]);

  const handleClosePrompt = useCallback(() => {
    setIsPromptOpen(false);
  }, []);

  const onSignIn = useCallback(() => {
    router.push(`/signin?redirect_url=${window.location.href}`);
  }, [router]);

  const nextPuzzleType = useMemo(() => {
    const currentType = getType(puzzle);
    switch (currentType) {
      case 'moji':
        return 'mini';
      case 'mini':
        return 'cube';
      case 'cube':
        return 'mega';
      case 'mega':
        return 'moji';
      default:
        return 'moji';
    }
  }, [puzzle]);

  const leftChevronIcon = useMemo(() => {
    return <FontAwesomeIcon icon={faChevronLeft} width={20} />;
  }, []);

  const rightChevronIcon = useMemo(() => {
    return <FontAwesomeIcon icon={faChevronRight} width={20} />;
  }, []);

  const leftChevronButton = useMemo(() => {
    return (
      <IconContainer onClick={handlePrevWord(selected)}>
        {leftChevronIcon}
      </IconContainer>
    );
  }, [handlePrevWord, leftChevronIcon, selected]);

  const rightChevronButton = useMemo(() => {
    return (
      <IconContainer onClick={handleNextWord(selected)}>
        {rightChevronIcon}
      </IconContainer>
    );
  }, [handleNextWord, rightChevronIcon, selected]);

  return (
    <>
      <Menu
        centerLabel={
          <TimerAndGuesses elapsedTime={elapsedTime ?? 0} guesses={guesses} />
        }
        rotatingBoxProps={rotatingBoxProps}
        autocheckEnabled={autoCheckEnabled}
        draftModeEnabled={draftModeEnabled}
        onAutocheckChanged={handleAutocheckChanged}
        onDraftModeChanged={handleDraftModeChanged}
        onSettingsPressed={handleSettingsPressed}
        onDisplayChange={setIsMenuOpen}
        onSignInPressed={onSignIn}
        showBackground={false}
      >
        <Canvas
          gl={{ antialias: false }}
          style={{
            touchAction: 'none',
          }}
          ref={containerRef}
        >
          <Suspense fallback={<Loader />}>
            <fog
              attach="fog"
              color={new Color(0x222222)}
              near={fogNear}
              far={fogFar}
            />
            <PerspectiveCamera
              ref={setCameraRef}
              makeDefault
              position={[0, 0, 0]}
              fov={50}
            />
            <ambientLight intensity={1} />
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
                  selected={selected}
                  onSelectedChange={handleSelectedChange}
                  selectedSide={selectedSide}
                  keyAndIndexOverride={keyAndIndexOverride}
                  currentKey={selectedCharacter}
                  updateCharacterPosition={updateCharacterPosition}
                  onLetterInput={onLetterInput}
                  fontColor={fontColor}
                  fontDraftColor={fontDraftColor}
                  selectedColor={defaultColor}
                  errorColor={errorColor}
                  correctColor={correctColor}
                  onInitialize={onInitialize}
                  isVerticalOrientation={isVerticalOrientation}
                  onVerticalOrientationChange={handleSetOrientation}
                  autoCheckEnabled={autoCheckEnabled}
                  selectNextBlankEnabled={selectNextBlankEnabled}
                  characterPositionArray={
                    characterPositions ?? defaultCharacterPositions
                  }
                  cellValidationArray={validations ?? defaultValidations}
                  cellDraftModeArray={draftModes ?? defaultDraftModes}
                  autoNextEnabled={autoNextEnabled}
                  turnLeft={turnLeft}
                  turnRight={turnRight}
                  setGoToNextWord={setGoToNextWord}
                  theme={theme}
                  isSpinning={isSpinning}
                  isSingleSided={isSingleSided}
                />
              </group>
            </SwipeControls>
            <Sparks
              count={isPuzzleSolved === true ? 20 : 0}
              mouse={mouse}
              radius={objectDepth / 2}
              colors={sparkColors}
            />
          </Suspense>
        </Canvas>
        {isInitialized === true && (
          <>
            <InfoBarWrapper>
              <InfoBar>
                <TurnButton
                  onClick={handleLeftButtonClick}
                  $color={toHex(adjacentColor)}
                >
                  {isSingleSided === false ? (
                    <TurnArrow
                      width={20}
                      height={20}
                      color={toHex(turnArrowColor)}
                    />
                  ) : (
                    leftChevronIcon
                  )}
                </TurnButton>
                <ClueContainer
                  $backgroundColor={toHex(adjacentColor)}
                  onClick={onClueClick}
                >
                  <ClueTextContainer>
                    {cellNumber != null && (
                      <SelectedInfo $backgroundColor={toHex(selectedColor)}>
                        {`${cellNumber}`}
                        {isSelectedSingleCell == false ? (
                          isVerticalOrientation ? (
                            <FontAwesomeIcon
                              icon={faChevronCircleDown}
                              width={10}
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faChevronCircleRight}
                              width={10}
                            />
                          )
                        ) : null}
                      </SelectedInfo>
                    )}
                    &nbsp;
                    <ClueLabel
                      dangerouslySetInnerHTML={{ __html: animatedClueText }}
                    />{' '}
                  </ClueTextContainer>
                  {isSingleSided === false && (
                    <BackNextButtonsContainer>
                      {leftChevronButton}
                      <VRule />
                      {rightChevronButton}
                    </BackNextButtonsContainer>
                  )}
                </ClueContainer>
                <TurnButton
                  onClick={handleRightButtonClick}
                  $color={toHex(adjacentColor)}
                >
                  {isSingleSided === false ? (
                    <TurnArrow
                      width={20}
                      height={20}
                      flipped
                      color={toHex(turnArrowColor)}
                    />
                  ) : (
                    rightChevronIcon
                  )}
                </TurnButton>
              </InfoBar>
            </InfoBarWrapper>
            <KeyboardContainer $svgCssMap={svgCssMap}>
              {isPuzzleSolved && (
                <SolvedContainer>
                  &ldquo;You did it!&rdquo;
                  <ShareButton onClick={handleSharePressed} />
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
        selectNextBlank={selectNextBlankEnabled}
        hideNextBlank={disableNextBlankEnabled}
        onSelectNextBlankChanged={addSelectNextBlankEnabled}
      />
      {puzzleStats != null && (
        <PuzzleShare
          type={nextPuzzleType}
          isOpen={isShareOpen}
          onClose={handleShareClose}
          puzzleStats={puzzleStats}
          puzzleLabel={getPuzzleLabel(puzzle)}
          puzzleSubLabel={puzzle.title}
          onAuthClick={onSignIn}
        />
      )}
      <PuzzlePrompt
        isOpen={isPromptOpen}
        onClose={handleClosePrompt}
        onDontShowAgain={handleDontShowTryAgain}
      />
    </>
  );
}
