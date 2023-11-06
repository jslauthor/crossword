'use client';

import React, { ReactNode, useRef } from 'react';
import Header from 'components/core/Header';
import styled from 'styled-components';
import { Button } from '@nextui-org/react';
import { useCallback, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useElementSize, useOnClickOutside } from 'usehooks-ts';
import UserInfo from 'components/composed/UserInfo';
import { Link } from '@nextui-org/react';
import { AnimatePresence, motion } from 'framer-motion';

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

const ClipContainer = styled.div<{ $headerHeight: number }>`
  position: fixed;
  width: var(--primary-app-width);
  overflow: hidden;
  display: flex;
  justify-content: stretch;
  ${({ $headerHeight }) => `
    top: ${$headerHeight}px; 
    height: calc(100svh - ${$headerHeight}px);
  `}
`;

const MenuContainer = styled(motion.nav)`
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: var(--primary-bg);
  max-width: 300px;
  width: 100%;
  height: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--menu-border);
  box-shadow: 10px 0px 10px 10px rgba(10, 10, 10, 0.25);
`;

const MenuItem = styled.div`
  font-size: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background-color: var(--secondary-bg);
`;

const UserInfoStyled = styled(UserInfo)`
  margin: 0.5rem;
`;

const SignInContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: stretch;
`;

const MenuItemsContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  overflow-x: hidden;
`;

type MenuWrapperProps = {
  children?: ReactNode;
  centerLabel?: string;
};

const MenuWrapper: React.FC<MenuWrapperProps> = ({ children, centerLabel }) => {
  const { isSignedIn, user } = useUser();
  const [headerRef, { height }] = useElementSize();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const handleMenuPressed = useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);
  const handleClickOutside = useCallback(() => {
    setIsMenuOpen(false);
  }, []);
  useOnClickOutside(menuRef, handleClickOutside);
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
        <AnimatePresence>
          {isMenuOpen && (
            <ClipContainer $headerHeight={height}>
              <MenuContainer
                ref={menuRef}
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                exit={{ x: '-110%' }}
              >
                {isSignedIn === false && (
                  <MenuItem>
                    <Link color="foreground">Log In</Link> or{' '}
                    <Link color="foreground">Sign Up</Link>
                  </MenuItem>
                )}
                <MenuItemsContainer>
                  <MenuItem>
                    <Link color="foreground">Give Feedback</Link>
                  </MenuItem>
                  <MenuItem>
                    <Link color="foreground">Terms of Service</Link>
                  </MenuItem>
                  <MenuItem>
                    <Link color="foreground">Privacy Policy</Link>
                  </MenuItem>
                </MenuItemsContainer>
                <div>
                  <Divider />
                  {isSignedIn === true && (
                    <SignInContainer>
                      <UserInfoStyled
                        name={user.fullName ?? ''}
                        email={user.primaryEmailAddress?.emailAddress ?? ''}
                      />
                      <Button size="sm" variant="bordered">
                        Log Out
                      </Button>
                    </SignInContainer>
                  )}
                </div>
              </MenuContainer>
            </ClipContainer>
          )}
        </AnimatePresence>
      </ChildrenContainer>
    </Container>
  );
};

export default MenuWrapper;
