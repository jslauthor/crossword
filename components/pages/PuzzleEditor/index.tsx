'use client';

import Menu from 'components/containers/Menu';
import EmojiSelector from 'components/core/EmojiSelector';
import { Button } from 'components/core/ui/button';
import { Tabs, TabsList, TabsTrigger } from 'components/core/ui/tabs';
import Crossword from 'components/svg/Crossword';
import Gear from 'components/svg/Gear';
import Symmetry from 'components/svg/Symmetry';
import { Keyboard, List } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

enum TabsEnum {
  Puzzle = 'puzzle',
  Clues = 'clues',
  Keyboard = 'keyboard',
}

export function PuzzleEditor() {
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
        <Button variant="ghost" size="icon">
          <Gear width={16} height={16} />
        </Button>
        <Button variant="outline">Publish</Button>
      </>
    );
  }, []);

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
        centerLabel={<div className="min-w-[200px]">{centerLabel}</div>}
        rightContent={rightContent}
      >
        <div className="flex flex-col gap-0 justify-center items-center w-full">
          <EmojiSelector className="h-[500px]" />
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
                <Keyboard width={16} height={16} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Menu>
    </>
  );
}
