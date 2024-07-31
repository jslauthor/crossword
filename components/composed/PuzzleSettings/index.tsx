'use client';

import { HRule } from 'components/core/Dividers';
import Overlay, { OverlayProps } from 'components/core/Overlay';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useTheme } from 'lib/utils/hooks/theme';
import { Switch } from 'components/core/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/core/ui/select';

const SettingsContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1.5rem;
`;

export const SettingsTitle = styled.h3`
  text-transform: uppercase;
  font-size: 0.875rem;
  font-weight: 400;
  margin: 0;
  opacity: 0.5;
  padding: 0 1rem;
`;

const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  gap: 0.5rem;
`;

export const SettingsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.125rem;
  padding: 0 1rem;
`;

interface PuzzleSettingsProps extends Partial<OverlayProps> {
  autoNextEnabled?: boolean;
  selectNextBlank?: boolean;
  onAutoNextChanged?: (autoNextEnabled: boolean) => void;
  onSelectNextBlankChanged?: (enabled: boolean) => void;
  onThemChange?: (theme: string) => void;
}

const noop = () => {};

const PuzzleSettings: React.FC<PuzzleSettingsProps> = ({
  title = 'Puzzle Settings',
  isOpen = false,
  onClose = noop,
  autoNextEnabled = false,
  selectNextBlank = false,
  onAutoNextChanged = noop,
  onSelectNextBlankChanged = noop,
}) => {
  const { theme, setTheme, themes } = useTheme();

  const handleThemePressed = useCallback(
    (value: string) => {
      setTheme(value);
    },
    [setTheme],
  );

  const handleSelectNextBlankTogglePressed = useCallback(() => {
    onSelectNextBlankChanged(!selectNextBlank);
  }, [onSelectNextBlankChanged, selectNextBlank]);

  const handleAutoNextTogglePressed = useCallback(() => {
    onAutoNextChanged(!autoNextEnabled);
  }, [autoNextEnabled, onAutoNextChanged]);

  return (
    <Overlay title={title} onClose={onClose} isOpen={isOpen}>
      <SettingsContainer>
        <SettingsSection>
          <SettingsTitle>At the end of a word...</SettingsTitle>
          <HRule />
          <SettingsItem>
            <div>Jump to the next clue</div>
            <Switch
              checked={autoNextEnabled}
              onCheckedChange={handleAutoNextTogglePressed}
            />
          </SettingsItem>
          <HRule />
          <SettingsItem>
            <div>Select next blank</div>
            <Switch
              checked={selectNextBlank}
              onCheckedChange={handleSelectNextBlankTogglePressed}
            />
          </SettingsItem>
          <HRule />
        </SettingsSection>
        <SettingsSection>
          <SettingsTitle>Other</SettingsTitle>
          <HRule />
          <SettingsItem>
            <div>Color Theme</div>
            <Select value={theme} onValueChange={handleThemePressed}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                {themes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsItem>
          <HRule />
        </SettingsSection>
      </SettingsContainer>
    </Overlay>
  );
};

export default PuzzleSettings;
