import IconHamburger from 'components/svg/IconHamburger';
import IconQuestion from 'components/svg/IconQuestion';
import IconX from 'components/svg/IconX';
import IconMainLogo from 'components/svg/MainLogo';
import { useCallback, useMemo } from 'react';
import { styled } from 'styled-components';
import RotatingBox, { RotatingBoxProps } from '../3d/Box';
import Link from 'next/link';
import { Button } from '@nextui-org/react';
import LightBulb from 'components/svg/LightBulb';
import Pencil from 'components/svg/Pencil';

const Container = styled.nav<{ $hasCenterLabel: boolean }>`
  display: grid;
  grid-gap: 0.75rem;
  ${({ $hasCenterLabel }) =>
    $hasCenterLabel
      ? `grid-template-columns: min-content min-content 1fr min-content;`
      : `grid-template-columns: min-content 1fr min-content;`}

  align-items: center;
`;

const CloseButtonContainer = styled.div`
  width: 18px;
  grid-column: 1 / 2;
`;

const LogoStyled = styled(IconMainLogo)`
  grid-column: 2 / 3;
`;

const CenterLabelContainer = styled.div`
  grid-column: 3 / 4;
  justify-self: center;
`;

const RightContentContainer = styled.div`
  grid-column: 4 / 5;
  justify-self: end;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
`;

const HeaderButton = styled(Button)`
  height: 30px;
  width: 30px;
  min-width: 30px;
  border-radius: 0.25rem;
`;

interface HeaderProps {
  showCloseButton: boolean;
  centerLabel?: string;
  onMenuPressed: () => void;
  rotatingBoxProps?: RotatingBoxProps;
  onQuestionPressed?: () => void;
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
  onQuestionPressed,
  autocheckEnabled,
  onAutocheckChanged,
  onDraftModeChanged,
  draftModeEnabled,
}) => {
  const hasCenterLabel = useMemo(
    () => centerLabel != null && centerLabel.length > 0,
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

  return (
    <Container $hasCenterLabel={hasCenterLabel}>
      <CloseButtonContainer onClick={onMenuPressed}>
        {showCloseButton ? (
          <IconX width={20} height={25} />
        ) : (
          <IconHamburger width={20} height={25} />
        )}
      </CloseButtonContainer>
      <Link href="/">
        <LogoStyled width={140} height={25} />
      </Link>
      {hasCenterLabel === true && (
        <CenterLabelContainer>{centerLabel}</CenterLabelContainer>
      )}
      <RightContentContainer>
        {rotatingBoxProps && (
          <>
            <HeaderButton
              onClick={handleDraftModeChanged}
              color="default"
              variant={draftModeEnabled ? 'solid' : 'light'}
              isIconOnly
            >
              <Pencil />
            </HeaderButton>
            <HeaderButton
              onClick={handleAutocheckChanged}
              color="default"
              variant={autocheckEnabled ? 'solid' : 'light'}
              isIconOnly
            >
              <LightBulb />
            </HeaderButton>
            <RotatingBox
              side={rotatingBoxProps.side}
              defaultColor={rotatingBoxProps.defaultColor}
            />
          </>
        )}
        <div onClick={onQuestionPressed}>
          <IconQuestion width={25} height={25} />
        </div>
      </RightContentContainer>
    </Container>
  );
};

export default Header;
