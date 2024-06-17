'use client';

import { Select, SelectItem, Switch } from '@nextui-org/react';
import { HRule } from 'components/core/Dividers';
import Overlay, { OverlayProps } from 'components/core/Overlay';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useTheme } from 'lib/utils/hooks/theme';

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1.5rem;
`;

const SettingsTitle = styled.h3`
  text-transform: uppercase;
  font-size: 0.875rem;
  font-weight: 400;
  margin: 0;
  opacity: 0.5;
`;

const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  gap: 0.5rem;
`;

const SettingsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.125rem;
`;

interface PuzzleSettingsProps extends Partial<OverlayProps> {
  autoNextEnabled?: boolean;
  onAutoNextChanged?: (autoNextEnabled: boolean) => void;
  onThemChange?: (theme: string) => void;
}

const noop = () => {};

const PuzzleSettings: React.FC<PuzzleSettingsProps> = ({
  title = 'Puzzle Settings',
  isOpen = false,
  onClose = noop,
  autoNextEnabled = false,
  onAutoNextChanged = noop,
}) => {
  const { theme, setTheme, colors, themes } = useTheme();

  const handleThemePressed = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setTheme(e.target.value);
    },
    [setTheme],
  );

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
              color="primary"
              isSelected={autoNextEnabled}
              onValueChange={handleAutoNextTogglePressed}
            />
          </SettingsItem>
          <HRule />
        </SettingsSection>
        <SettingsSection>
          <SettingsTitle>Other</SettingsTitle>
          <HRule />
          <SettingsItem>
            <div>Color Theme</div>
            <Select
              variant="underlined"
              placeholder="Select a theme..."
              className="max-w-44"
              value={theme}
              onChange={handleThemePressed}
              classNames={{
                trigger: 'border-none shadow-transparent',
                innerWrapper: 'text-inherit',
                value: 'text-inherit',
              }}
            >
              {themes.map((theme) => (
                <SelectItem key={theme}>{theme}</SelectItem>
              ))}
            </Select>
          </SettingsItem>
          <HRule />
        </SettingsSection>
      </SettingsContainer>
    </Overlay>
  );
};

export default PuzzleSettings;
