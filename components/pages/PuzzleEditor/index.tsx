'use client';

import { PuzzleEditorProps } from 'app/puzzle/editor/[[...slug]]/page';
import { ClueEditor } from 'components/composed/ClueEditor';
import Keyboard, {
  SUPPORTED_KEYBOARD_CHARACTERS,
} from 'components/composed/Keyboard';
import PuzzleCanvas from 'components/composed/PuzzleCanvas';
import PuzzleEditorSettings from 'components/composed/PuzzleEditorSettings';
import Menu from 'components/containers/Menu';
import EmojiSelector from 'components/core/EmojiSelector';
import { Button } from 'components/core/ui/button';
import { Carousel } from 'components/core/ui/carousel';
import { Tabs, TabsList, TabsTrigger } from 'components/core/ui/tabs';
import Crossword from 'components/svg/Crossword';
import Gear from 'components/svg/Gear';
import Symmetry from 'components/svg/Symmetry';
import { usePuzzleEditorStore } from 'lib/providers/puzzle-editor-provider';
import { cn } from 'lib/utils';
import useSvgAtlas from 'lib/utils/hooks/useSvgAtlas';
import { Keyboard as KeyboardIcon, List } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import posthog from 'posthog-js';
import { InstancedMesh } from 'three';
import { useKeyDown } from 'lib/utils/hooks/useKeyDown';
import { useTheme } from 'lib/utils/hooks/theme';
import tinycolor from 'tinycolor2';
import { isPuzzleSingleSided } from 'lib/utils/puzzle';

const noopArray = new Int16Array();
const noop = () => {};

enum TabsEnum {
  Puzzle = 'puzzle',
  Clues = 'clues',
  Keyboard = 'keyboard',
}

export function PuzzleEditor({
  puzzle,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
}: PuzzleEditorProps) {
  const {
    svgTextureAtlas,
    svgTextureAtlasLookup,
    svgGridSize,
    svgContentMap,
    error: svgError,
  } = useSvgAtlas(puzzle.svgSegments);

  useEffect(() => {
    if (svgError === true) {
      console.error('Failed to load emojis in the SVG texture atlas!');
      posthog.capture('puzzle_svg_error', { puzzleId: puzzle.id });
    }
  }, [puzzle.id, svgError]);

  const title = usePuzzleEditorStore((store) => store.title);
  const style = usePuzzleEditorStore((store) => store.style);
  const type = usePuzzleEditorStore((store) => store.type);
  const size = usePuzzleEditorStore((store) => store.size);
  // const keyMap = usePuzzleEditorStore((store) => store.keyMap);
  const isSettingsOpen = usePuzzleEditorStore((store) => store.showSettings);
  const updateTitle = usePuzzleEditorStore((store) => store.updateTitle);
  const updateStyle = usePuzzleEditorStore((store) => store.updateStyle);
  const updateType = usePuzzleEditorStore((store) => store.updateType);
  const updateSize = usePuzzleEditorStore((store) => store.updateSize);
  const toggleSettings = usePuzzleEditorStore((store) => store.toggleSettings);
  const characterPositions = usePuzzleEditorStore(
    (store) => store.characterPositions,
  );

  const initializeCharacterPositions = usePuzzleEditorStore(
    (store) => store.initializeCharacterPositions,
  );
  const updateCharacterPosition = usePuzzleEditorStore(
    (store) => store.updateCharacterPosition,
  );

  useEffect(() => {
    initializeCharacterPositions(puzzle);
  }, [initializeCharacterPositions, puzzle]);

  const handleSettingsPressed = useCallback(() => {
    toggleSettings(!isSettingsOpen);
  }, [isSettingsOpen, toggleSettings]);

  const [shouldResetTabs, setShouldResetTabs] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabsEnum>(TabsEnum.Puzzle);
  const handleTabChange = useCallback((value: string) => {
    setSelectedTab(value as TabsEnum);
  }, []);

  useEffect(() => {
    if (style === 'default' && selectedTab === TabsEnum.Keyboard) {
      setShouldResetTabs(true);
    }
  }, [selectedTab, style]);

  useEffect(() => {
    if (shouldResetTabs) {
      setShouldResetTabs(false);
      setSelectedTab(TabsEnum.Puzzle);
    }
  }, [shouldResetTabs]);

  // const svgContentMap: Record<string, string> = useMemo(() => {
  //   const svgMap: Record<string, string> = {};
  //   for (const item of keyMap) {
  //     svgMap[item[0]] = item[1][1];
  //   }
  //   return svgMap;
  // }, [keyMap]);

  const handleKeyPress = useCallback((key: string) => {
    console.log(key);
  }, []);

  const rightContent = useMemo(() => {
    return (
      <>
        <Button variant="ghost" size="icon">
          <Symmetry width={16} height={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleSettingsPressed}>
          <Gear width={16} height={16} />
        </Button>
        <Button variant="outline">Publish</Button>
      </>
    );
  }, [handleSettingsPressed]);

  const centerLabel = useMemo(() => {
    switch (selectedTab) {
      case TabsEnum.Puzzle:
        return <span className="opacity-50">Edit Cells</span>;
      case TabsEnum.Clues:
        return <span className="opacity-50">Edit Clues</span>;
      case TabsEnum.Keyboard:
        return <span className="opacity-50">Edit Keyboard</span>;
    }
  }, [selectedTab]);

  const carouselIndex = useMemo(() => {
    switch (selectedTab) {
      case TabsEnum.Puzzle:
        return 0;
      case TabsEnum.Clues:
        return 1;
      case TabsEnum.Keyboard:
        return style === 'emoji' ? 2 : 0;
      default:
        return 0;
    }
  }, [selectedTab, style]);

  const themeProvider = useTheme();
  const {
    theme,
    colors: {
      font: fontColor,
      fontDraft: fontDraftColor,
      default: defaultColor,
      selected: selectedColor,
      selectedAdjacent: adjacentColor,
      correct: correctColor,
      error: errorColor,
      // turnArrow: turnArrowColor,
    },
  } = themeProvider;

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

  const isSingleSided = useMemo(() => isPuzzleSingleSided(puzzle), [puzzle]);

  const [selected, setSelected] = useState<InstancedMesh['id'] | undefined>(0);
  const [selectedCharacter, setSelectedCharacter] = useState<
    string | undefined
  >();

  const onLetterChange = useCallback((key: string) => {
    setSelectedCharacter(key);
  }, []);
  useKeyDown(onLetterChange, SUPPORTED_KEYBOARD_CHARACTERS);

  // TODO: Do we need to do this?
  const onLetterInput = useCallback(() => {
    setSelectedCharacter(undefined);
  }, []);

  return (
    <>
      <Menu
        centerLabel={<div className="min-w-[100px]">{centerLabel}</div>}
        rightContent={rightContent}
      >
        <div className="relative h-full w-full grid grid-rows-[1fr_auto_auto]">
          <Carousel currentIndex={carouselIndex}>
            <PuzzleCanvas
              isInitialized={true}
              onInitialize={console.log}
              puzzle={puzzle}
              svgTextureAtlas={svgTextureAtlas}
              svgTextureAtlasLookup={svgTextureAtlasLookup}
              svgGridSize={svgGridSize}
              characterTextureAtlasLookup={characterTextureAtlasLookup}
              cellNumberTextureAtlasLookup={cellNumberTextureAtlasLookup}
              selected={selected}
              onSelectedChange={setSelected}
              currentKey={selectedCharacter}
              updateCharacterPosition={updateCharacterPosition}
              onLetterInput={onLetterInput}
              fontColor={fontColor}
              fontDraftColor={fontDraftColor}
              selectedColor={defaultColor}
              errorColor={errorColor}
              correctColor={correctColor}
              isVerticalOrientation={false}
              onVerticalOrientationChange={noop}
              autoCheckEnabled={false}
              selectNextBlankEnabled={false}
              characterPositionArray={characterPositions}
              cellValidationArray={noopArray}
              cellDraftModeArray={noopArray}
              autoNextEnabled={false}
              setGoToNextWord={() => {}}
              theme={theme}
              isSingleSided={isSingleSided}
              isPuzzleSolved={false}
              sparkColors={sparkColors}
              // onSelectedSideChange={setSelectedSide}
              // onSideOffsetChange={setSideOffset}
              // shouldTurn={shouldTurn}
              // onTurnReset={onTurnComplete}
            />
            <ClueEditor puzzle={puzzle} />
            {style === 'emoji' && <EmojiSelector className="h-full" />}
          </Carousel>
          <Tabs
            defaultValue="puzzle"
            className="w-full"
            onValueChange={handleTabChange}
            value={selectedTab}
          >
            <TabsList
              className={cn(
                'grid w-ful items-stretch h-min',
                style === 'emoji' ? 'grid-cols-3' : 'grid-cols-2',
              )}
            >
              <TabsTrigger value={TabsEnum.Puzzle} className="p-3">
                <Crossword width={16} height={16} />
              </TabsTrigger>
              <TabsTrigger value={TabsEnum.Clues} className="p-3">
                <List width={16} height={16} />
              </TabsTrigger>
              {style === 'emoji' && (
                <TabsTrigger value={TabsEnum.Keyboard} className="p-3">
                  <KeyboardIcon width={16} height={16} />
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          <Keyboard
            layout={style}
            svgContentMap={svgContentMap}
            onKeyPress={handleKeyPress}
          />
        </div>
      </Menu>
      <PuzzleEditorSettings
        isOpen={isSettingsOpen}
        onOpenChange={toggleSettings}
        title={title}
        style={style}
        type={type}
        size={size}
        onTitleChange={updateTitle}
        onStyleChange={updateStyle}
        onTypeChange={updateType}
        onSizeChange={updateSize}
      />
    </>
  );
}
