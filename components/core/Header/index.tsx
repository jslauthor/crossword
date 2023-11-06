import IconHamburger from 'components/svg/IconHamburger';
import IconQuestion from 'components/svg/IconQuestion';
import IconX from 'components/svg/IconX';
import IconMainLogo from 'components/svg/MainLogo';
import { useMemo } from 'react';
import { styled } from 'styled-components';

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

const QuestionStyled = styled(IconQuestion)`
  grid-column: 4 / 5;
  justify-self: end;
`;

interface HeaderProps {
  showCloseButton: boolean;
  centerLabel?: string;
  onMenuPressed: () => void;
}

const Header: React.FC<HeaderProps> = ({
  showCloseButton,
  centerLabel,
  onMenuPressed,
}) => {
  const hasCenterLabel = useMemo(
    () => centerLabel != null && centerLabel.length > 0,
    [centerLabel]
  );

  return (
    <Container $hasCenterLabel={hasCenterLabel}>
      <CloseButtonContainer onClick={onMenuPressed}>
        {showCloseButton ? (
          <IconX width={20} height={25} />
        ) : (
          <IconHamburger width={20} height={25} />
        )}
      </CloseButtonContainer>
      <LogoStyled width={140} height={25} />
      {hasCenterLabel === true && (
        <CenterLabelContainer>{centerLabel}</CenterLabelContainer>
      )}
      <QuestionStyled width={25} height={25} />
    </Container>
  );
};

export default Header;
