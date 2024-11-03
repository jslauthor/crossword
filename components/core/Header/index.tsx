import IconHamburger from 'components/svg/IconHamburger';
import IconX from 'components/svg/IconX';
import { ReactNode, useMemo } from 'react';
import { styled } from 'styled-components';
import Link from 'next/link';

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
  rightContent?: string | ReactNode;
  onMenuPressed: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  showCloseButton,
  centerLabel,
  onMenuPressed,
  rightContent,
  className,
}) => {
  const hasCenterLabel = useMemo(
    () =>
      centerLabel != null &&
      ((typeof centerLabel === 'string' && centerLabel.length > 0) ||
        typeof centerLabel !== 'string'),
    [centerLabel],
  );

  return (
    <Container $hasCenterLabel={hasCenterLabel} className={className}>
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
      <RightContentContainer>{rightContent}</RightContentContainer>
    </Container>
  );
};

export default Header;
