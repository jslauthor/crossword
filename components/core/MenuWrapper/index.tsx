'use client';

import React, { ReactNode } from 'react';
import Header from 'components/core/Header';
import styled from '@emotion/styled';
import { useCallback, useState } from 'react';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`;

const HeaderContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  max-width: var(--primary-app-width);
`;

const HeaderStyled = styled(Header)`
  width: 100%;
`;

type MenuWrapperProps = {
  children?: ReactNode;
  centerLabel?: string;
};

const MenuWrapper: React.FC<MenuWrapperProps> = ({ children, centerLabel }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleMenuPressed = useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);
  return (
    <Container>
      <HeaderContainer>
        <HeaderStyled
          onMenuPressed={handleMenuPressed}
          showCloseButton={isMenuOpen}
          centerLabel={centerLabel}
        />
      </HeaderContainer>
      {children}
    </Container>
  );
};

export default MenuWrapper;
