'use client';

import React, { ReactNode } from 'react';
import Header from 'components/core/Header';
import styled from 'styled-components';
import { useCallback, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useElementSize } from 'usehooks-ts';

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

const ChildrenContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: var(--primary-app-width);
`;

const HeaderContainer = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: linear-gradient(var(--primary-bg), #00000000);
  padding: 0.75rem;
`;

const HeaderStyled = styled(Header)`
  width: 100%;
`;

const MenuContainer = styled.nav<{ $headerHeight: number }>`
  position: fixed;
  background-color: var(--primary-bg);
  max-width: 300px;
  width: 100%;
  padding: 0 0.75rem;
  bottom: 0;
  border: 1px solid var(--menu-border);
  box-shadow: 10px 0px 10px 10px rgba(10, 10, 10, 0.25);
  ${({ $headerHeight }) => `top: ${$headerHeight}px;`}
`;

const MenuItem = styled.div`
  font-size: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 0.75rem 0;
`;

const MenuItemHeader = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  margin: 0.75rem 0;
  text-transform: uppercase;
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background-color: var(--secondary-bg);
`;

type MenuWrapperProps = {
  children?: ReactNode;
  centerLabel?: string;
};

const MenuWrapper: React.FC<MenuWrapperProps> = ({ children, centerLabel }) => {
  const { isSignedIn, user } = useUser();

  const [headerRef, { height }] = useElementSize();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleMenuPressed = useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);
  return (
    <Container>
      <ChildrenContainer>
        <HeaderContainer ref={headerRef}>
          <HeaderStyled
            onMenuPressed={handleMenuPressed}
            showCloseButton={isMenuOpen}
            centerLabel={centerLabel}
          />
        </HeaderContainer>
        {children}
        {isMenuOpen && (
          <MenuContainer $headerHeight={height}>
            <MenuItem>Autocheck</MenuItem>
            <Divider />
            {isSignedIn === true && (
              <div>
                <MenuItemHeader>profile</MenuItemHeader>
                <MenuItem>Log Out</MenuItem>
              </div>
            )}
          </MenuContainer>
        )}
      </ChildrenContainer>
    </Container>
  );
};

export default MenuWrapper;
