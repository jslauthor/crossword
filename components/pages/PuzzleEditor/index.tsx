'use client';

import Keyboard from 'components/composed/Keyboard';
import PuzzleEditorSettings from 'components/composed/PuzzleEditorSettings';
import Menu from 'components/containers/Menu';
import EmojiSelector from 'components/core/EmojiSelector';
import { Button } from 'components/core/ui/button';
import { Tabs, TabsList, TabsTrigger } from 'components/core/ui/tabs';
import Crossword from 'components/svg/Crossword';
import Gear from 'components/svg/Gear';
import Symmetry from 'components/svg/Symmetry';
import { usePuzzleEditorStore } from 'lib/providers/puzzle-editor-provider';
import { Keyboard as KeyboardIcon, List } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

enum TabsEnum {
  Puzzle = 'puzzle',
  Clues = 'clues',
  Keyboard = 'keyboard',
}

export function PuzzleEditor() {
  const title = usePuzzleEditorStore((store) => store.title);
  const style = usePuzzleEditorStore((store) => store.style);
  const type = usePuzzleEditorStore((store) => store.type);
  const size = usePuzzleEditorStore((store) => store.size);
  const isSettingsOpen = usePuzzleEditorStore((store) => store.showSettings);
  const updateTitle = usePuzzleEditorStore((store) => store.updateTitle);
  const updateStyle = usePuzzleEditorStore((store) => store.updateStyle);
  const updateType = usePuzzleEditorStore((store) => store.updateType);
  const updateSize = usePuzzleEditorStore((store) => store.updateSize);
  const toggleSettings = usePuzzleEditorStore((store) => store.toggleSettings);
  const handleSettingsPressed = useCallback(() => {
    toggleSettings(!isSettingsOpen);
  }, [isSettingsOpen, toggleSettings]);

  const [selectedTab, setSelectedTab] = useState<TabsEnum>(TabsEnum.Puzzle);
  const handleTabChange = useCallback((value: string) => {
    setSelectedTab(value as TabsEnum);
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
        return 'Edit Cells';
      case TabsEnum.Clues:
        return 'Edit Clues';
      case TabsEnum.Keyboard:
        return 'Edit Keyboard';
    }
  }, [selectedTab]);

  return (
    <>
      <Menu
        centerLabel={<div className="min-w-[100px]">{centerLabel}</div>}
        rightContent={rightContent}
      >
        <div className="relative h-full w-full grid grid-rows-[auto_auto_auto]">
          <EmojiSelector />
          <Tabs
            defaultValue="puzzle"
            className="w-full"
            onValueChange={handleTabChange}
            value={selectedTab}
          >
            <TabsList className="grid w-full grid-cols-3 items-stretch">
              <TabsTrigger value={TabsEnum.Puzzle}>
                <Crossword width={16} height={16} />
              </TabsTrigger>
              <TabsTrigger value={TabsEnum.Clues}>
                <List width={16} height={16} />
              </TabsTrigger>
              <TabsTrigger value={TabsEnum.Keyboard}>
                <KeyboardIcon width={16} height={16} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Keyboard layout="default" svgContentMap={{}} />
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
