import IconHamburger from 'components/svg/IconHamburger';
import IconX from 'components/svg/IconX';
import { ReactNode, useCallback, useMemo } from 'react';
import { styled } from 'styled-components';
import RotatingBox, { RotatingBoxProps } from '../3d/Box';
import Link from 'next/link';
import LightBulb from 'components/svg/LightBulb';
import Pencil from 'components/svg/Pencil';
import { getColorHex } from 'lib/utils/color';
import Gear from 'components/svg/Gear';
import { Button } from '../ui/button';
import { useTheme } from 'lib/utils/hooks/theme';

const Container = styled.nav<{ $hasCenterLabel: boolean }>`
  display: grid;
  grid-gap: 0.75rem;
  ${({ $hasCenterLabel }) =>
    $hasCenterLabel
      ? `grid-template-columns: min-content min-content 1fr min-content;`
      : `grid-template-columns: min-content 1fr min-content;`}

  align-items: center;
`;

const MenuIconContainer = styled.div`
  width: 18px;
`;

const LogoStyled = styled.div`
  letter-spacing: -1.28px;
  font-weight: 600;
  font-size: 1.5rem;
  font-style: italic;
  text-align: center;
`;

const CenterLabelContainer = styled.div``;

const RightContentContainer = styled.div`
  // grid-column: 4 / 5;
  align-self: end;
  justify-self: flex-end;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  min-width: 18px;
`;

interface HeaderProps {
  showCloseButton: boolean;
  centerLabel?: string | ReactNode;
  onMenuPressed: () => void;
  onSettingsPressed?: () => void;
  rotatingBoxProps?: RotatingBoxProps;
  autocheckEnabled?: boolean;
  draftModeEnabled?: boolean;
  onAutocheckChanged?: (autocheckEnabled: boolean) => void;
  onDraftModeChanged?: (draftModeEnabled: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  showCloseButton,
  centerLabel,
  onMenuPressed,
  rotatingBoxProps,
  autocheckEnabled,
  onAutocheckChanged,
  onDraftModeChanged,
  draftModeEnabled,
  onSettingsPressed,
}) => {
  const { colors } = useTheme();

  const hasCenterLabel = useMemo(
    () =>
      centerLabel != null &&
      ((typeof centerLabel === 'string' && centerLabel.length > 0) ||
        typeof centerLabel !== 'string'),
    [centerLabel],
  );

  const handleAutocheckChanged = useCallback(() => {
    if (onAutocheckChanged) {
      onAutocheckChanged(!autocheckEnabled);
    }
  }, [autocheckEnabled, onAutocheckChanged]);

  const handleDraftModeChanged = useCallback(() => {
    if (onDraftModeChanged) {
      onDraftModeChanged(!draftModeEnabled);
    }
  }, [draftModeEnabled, onDraftModeChanged]);

  const draftColor = useMemo(() => {
    return draftModeEnabled ? getColorHex(colors.correct) : undefined;
  }, [colors.correct, draftModeEnabled]);

  const correctColor = useMemo(() => {
    return autocheckEnabled ? getColorHex(colors.correct) : undefined;
  }, [autocheckEnabled, colors.correct]);

  return (
    <Container $hasCenterLabel={hasCenterLabel}>
      <MenuIconContainer onClick={onMenuPressed}>
        {showCloseButton ? (
          <IconX width={20} height={25} />
        ) : (
          <IconHamburger width={20} height={25} />
        )}
      </MenuIconContainer>
      {hasCenterLabel === false && (
        <Link href="/">
          <LogoStyled>crosscube</LogoStyled>
        </Link>
      )}
      {hasCenterLabel === true && (
        <CenterLabelContainer>{centerLabel}</CenterLabelContainer>
      )}
      <RightContentContainer>
        {rotatingBoxProps && (
          <>
            <Button
              onClick={handleDraftModeChanged}
              variant={draftModeEnabled ? 'outline' : 'ghost'}
              size="icon"
            >
              <Pencil fill={draftColor} width={16} height={16} />
            </Button>
            <Button
              onClick={handleAutocheckChanged}
              variant={autocheckEnabled ? 'outline' : 'ghost'}
              size="icon"
            >
              <LightBulb fill={correctColor} width={16} height={16} />
            </Button>
            <Button onClick={onSettingsPressed} variant="ghost" size="icon">
              <Gear width={16} height={16} />
            </Button>
            <RotatingBox
              side={rotatingBoxProps.side}
              color={rotatingBoxProps.color}
              textColor={rotatingBoxProps.textColor}
            />
          </>
        )}
      </RightContentContainer>
    </Container>
  );
};

export default Header;
