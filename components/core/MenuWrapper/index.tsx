'use client';

import React, { ReactNode } from 'react';
import Header from 'components/core/Header';
import styled from 'styled-components';
import { useCallback, useState } from 'react';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100%;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`;

const HeaderContainer = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  max-width: var(--primary-app-width);
  background: linear-gradient(var(--primary-bg), #00000000);
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
