import { HRule } from 'components/core/Dividers';
import type { KeyboardLayoutType } from 'components/composed/Keyboard';
import React, { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/core/ui/select';
import { Input } from 'components/core/ui/input';
import {
  PuzzleDimensionType,
  PuzzleLayout,
  PuzzleSizeType,
} from 'lib/stores/puzzle-editor';
import {
  SettingsItem,
  SettingsTitle,
} from 'components/composed/PuzzleSettings';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from 'components/core/ui/drawer';

interface PuzzleEditorSettingsProps {
  title: string | undefined;
  style: PuzzleLayout;
  type: PuzzleDimensionType;
  size: PuzzleSizeType;
  onTitleChange?: (title: string) => void;
  onStyleChange?: (style: keyof KeyboardLayoutType) => void;
  onTypeChange?: (type: PuzzleDimensionType) => void;
  onSizeChange?: (size: PuzzleSizeType) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const noop = () => {};

export function PuzzleEditorSettings({
  title,
  style,
  type,
  size,
  isOpen = false,
  onOpenChange = noop,
  onTitleChange = noop,
  onStyleChange = noop,
  onTypeChange = noop,
  onSizeChange = noop,
}: PuzzleEditorSettingsProps) {
  const handleStyleChange = useCallback(
    (value: PuzzleEditorSettingsProps['style']) => {
      onStyleChange(value);
    },
    [onStyleChange],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      onTypeChange(value as PuzzleDimensionType);
    },
    [onTypeChange],
  );

  const handleSizeChange = useCallback(
    (value: string) => {
      onSizeChange(Number(value) as PuzzleSizeType);
    },
    [onSizeChange],
  );

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="mb-8">
        <DrawerHeader className="flex flex-col justify-center items-center max-w-22 w-full my-6 p-0 gap-1">
          <DrawerTitle className="text-base font-normal">
            Puzzle Settings
          </DrawerTitle>
        </DrawerHeader>

        <div className="w-full flex flex-col justify-center items-center mb-1 ">
          <div className="max-w-[var(--max-app-width)] w-full flex flex-col gap-2 justify-center ">
            <SettingsTitle>Layout</SettingsTitle>
            <HRule />
            <SettingsItem>
              <div className="text-base">Title</div>
              <div className="min-w-[100px] max-w-[300px] w-full">
                <Input
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="w-full text-right text-base"
                  placeholder="Enter puzzle title..."
                  maxLength={35}
                />
              </div>
            </SettingsItem>
            <HRule />

            <SettingsItem>
              <div className="text-base">Keyboard Layout</div>
              <Select value={style} onValueChange={handleStyleChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">alphabet</SelectItem>
                  <SelectItem value="emoji">emojis</SelectItem>
                </SelectContent>
              </Select>
            </SettingsItem>
            <HRule />

            <SettingsItem>
              <div className="text-base">Puzzle Type</div>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2d">2D</SelectItem>
                  <SelectItem value="3d">3D</SelectItem>
                </SelectContent>
              </Select>
            </SettingsItem>
            <HRule />

            <SettingsItem>
              <div className="text-base">Puzzle Size</div>
              <Select value={size.toString()} onValueChange={handleSizeChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}x{size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsItem>
            <HRule />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default PuzzleEditorSettings;
