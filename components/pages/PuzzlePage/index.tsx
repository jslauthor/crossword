'use client';

import React, { MouseEvent } from 'react';
import styled from 'styled-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InstancedMesh } from 'three';
import { useKeyDown } from 'lib/utils/hooks/useKeyDown';
import tinycolor from 'tinycolor2';
import TurnArrow from 'components/svg/TurnArrow';
import { useAnimatedText } from 'lib/utils/hooks/useAnimatedText';
import { useElapsedTime } from 'use-elapsed-time';
import Menu from 'components/containers/Menu';
import { usePuzzleProgress } from 'lib/utils/hooks/usePuzzleProgress';
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
import useSvgAtlas from 'lib/utils/hooks/useSvgAtlas';
import { PuzzleProps } from 'app/puzzle/[slug]/page';
import TimerAndGuesses from 'components/composed/Timer';
import PuzzleShare from 'components/composed/PuzzleShare';
import ShareButton from 'components/core/ShareButton';
import PuzzlePrompt from 'components/composed/PuzzlePrompt';
import { usePageVisibility } from 'lib/utils/hooks/usePageVisibility';
import posthog from 'posthog-js';
import PuzzleHeaderSettings from 'components/composed/PuzzleHeaderSettings';
import Keyboard, { KeyboardLayoutType } from 'components/composed/Keyboard';
import PuzzleCanvas from 'components/composed/PuzzleCanvas';
import { RotatingBoxProps } from 'components/core/3d/Box';

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

const noop = () => {};

export default function Puzzle({
  puzzle,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
}: PuzzleProps) {
  const [width, rowLength] = useMemo(() => {
    const { width } = puzzle.data[0].dimensions;
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

  const { theme } = useTheme();
  const layout = useMemo<keyof KeyboardLayoutType>(
    () => (puzzle.svgSegments != null ? 'emoji' : 'default'),
    [puzzle.svgSegments],
  );

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

  const [keyAndIndexOverride, setKeyAndIndexOverride] =
    useState<[string, number]>();
  const [clue, setClue] = useState<string | undefined>();
  const [cellNumber, setCellNumber] = useState<number | undefined>();
  const [selected, setSelected] = useState<InstancedMesh['id'] | undefined>(0);
  const [selectedCharacter, setSelectedCharacter] = useState<
    string | undefined
  >();

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

  const [isSelectedSingleCell, setIsSelectedSingleCell] =
    useState<boolean>(false);

  const [selectedSide, setSelectedSide] = useState<number>(0);
  const [sideOffset, setSideOffset] = useState<number>(0);
  const [shouldTurn, setShouldTurn] = useState<'left' | 'right' | null>(null);

  const turnLeft = useCallback(() => {
    setShouldTurn('left');
  }, []);
  const turnRight = useCallback(() => {
    setShouldTurn('right');
  }, []);
  const onTurnComplete = useCallback(() => {
    setShouldTurn(null);
  }, []);

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

  const disableNextBlankEnabled = useMemo(() => {
    return isSingleSidedEmojiPuzzle === true;
  }, [isSingleSidedEmojiPuzzle]);

  const selectNextBlankEnabled = useMemo(() => {
    return disableNextBlankEnabled === false && selectNextBlankStored;
  }, [disableNextBlankEnabled, selectNextBlankStored]);

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
      turnArrow: turnArrowColor,
    },
  } = useTheme();

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

  useEffect(() => {
    if (isPuzzleSolved === true && hasInteractedWithPuzzle === true) {
      setIsShareOpen(true);
    }
  }, [isPuzzleSolved, hasInteractedWithPuzzle]);

  const handleClosePrompt = useCallback(() => {
    setIsPromptOpen(false);
  }, []);

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

  const rotatingBoxProps: RotatingBoxProps = useMemo(() => {
    return {
      color: selectedColor,
      textColor: fontColor,
      side: sideOffset,
    };
  }, [fontColor, selectedColor, sideOffset]);

  return (
    <>
      <Menu
        centerLabel={
          <TimerAndGuesses elapsedTime={elapsedTime ?? 0} guesses={guesses} />
        }
        rightContent={
          <PuzzleHeaderSettings
            rotatingBoxProps={rotatingBoxProps}
            autocheckEnabled={autoCheckEnabled}
            draftModeEnabled={draftModeEnabled}
            onAutocheckChanged={handleAutocheckChanged}
            onDraftModeChanged={handleDraftModeChanged}
            onSettingsPressed={handleSettingsPressed}
          />
        }
        onDisplayChange={setIsMenuOpen}
        showBackground={false}
      >
        <PuzzleCanvas
          isInitialized={isInitialized}
          onInitialize={onInitialize}
          puzzle={puzzle}
          svgTextureAtlas={svgTextureAtlas}
          svgTextureAtlasLookup={svgTextureAtlasLookup}
          svgGridSize={svgGridSize}
          characterTextureAtlasLookup={characterTextureAtlasLookup}
          cellNumberTextureAtlasLookup={cellNumberTextureAtlasLookup}
          selected={selected}
          onSelectedChange={handleSelectedChange}
          keyAndIndexOverride={keyAndIndexOverride}
          currentKey={selectedCharacter}
          updateCharacterPosition={updateCharacterPosition}
          onLetterInput={onLetterInput}
          fontColor={fontColor}
          fontDraftColor={fontDraftColor}
          selectedColor={defaultColor}
          errorColor={errorColor}
          correctColor={correctColor}
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
          setGoToNextWord={setGoToNextWord}
          theme={theme}
          isSingleSided={isSingleSided}
          isPuzzleSolved={isPuzzleSolved}
          sparkColors={sparkColors}
          onSelectedSideChange={setSelectedSide}
          onSideOffsetChange={setSideOffset}
          shouldTurn={shouldTurn}
          onTurnReset={onTurnComplete}
        />
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
            <div className="w-full h-max relative">
              <Keyboard
                layout={layout}
                svgContentMap={svgContentMap}
                onKeyPress={onKeyPress}
              />
              {isPuzzleSolved && (
                <SolvedContainer>
                  &ldquo;You did it!&rdquo;
                  <ShareButton onClick={handleSharePressed} />
                </SolvedContainer>
              )}
            </div>
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
