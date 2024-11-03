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
import { cn } from 'lib/utils';
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
  const keyMap = usePuzzleEditorStore((store) => store.keyMap);
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

  const svgContentMap: Record<string, string> = useMemo(() => {
    const svgMap: Record<string, string> = {};
    for (const item of keyMap) {
      svgMap[item[0]] = item[1][1];
    }
    return svgMap;
  }, [keyMap]);

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
