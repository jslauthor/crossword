'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import md5 from 'md5';
import Header from 'components/core/Header';
import styled from 'styled-components';
import { Button, Switch } from '@nextui-org/react';
import { useCallback, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useOnClickOutside, useResizeObserver } from 'usehooks-ts';
import UserInfo from 'components/composed/UserInfo';
import { Link } from '@nextui-org/react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotatingBoxProps } from '../3d/Box';
import TurnArrow from 'components/svg/TurnArrow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import ExampleCube from 'components/svg/ExampleCube';
import { useTheme } from 'lib/utils/hooks/theme';
import IconX from 'components/svg/IconX';

const Main = styled.div`
  position: relative;
  width: 100svw;
  height: 100svh;
`;

const HeaderContainer = styled.div`
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  background: linear-gradient(var(--primary-bg), #00000000);
  padding: 0.75rem;
`;

const HeaderStyled = styled(Header)`
  width: 100%;
`;

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100%;
  overflow-y: auto;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`;

const ChildrenContainer = styled.div<{ $headerHeight: number }>`
  position: relative;
  width: 100svw;
  height: 100svh;
  display: flex;
  flex-direction: column;
  justify-items: stretch;
  max-width: var(--primary-app-width);
  ${({ $headerHeight }) => `padding-top: ${$headerHeight}px;`}
`;

const ClipContainer = styled.div`
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: stretch;
  z-index: 9999;
`;

const MenuContainer = styled(motion.nav)<{ $headerHeight: number }>`
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: var(--primary-bg);
  max-width: 300px;
  width: 100%;
  height: 100%;
  padding: 0.75rem;
  box-shadow: 10px 0px 10px 10px rgba(10, 10, 10, 0.25);
`;

const MenuItem = styled.div`
  font-size: 1rem;
`;

const MenuItemFlex = styled(MenuItem)`
  display: flex;
  gap: 0.5rem;
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

const ModalContainer = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  inset: 0;
  background: rgb(0, 0, 0, 0.3);
`;

const Center = styled.div`
  padding-top: 1rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  position: relative;
  display: grid;
  grid-auto-flow: row;
  gap: 0.75rem;
  margin: 1rem;
  padding: 1rem;
  padding-top: 3rem;
  background: var(--secondary-bg);
  border-radius: 0.5rem;
  max-width: var(--primary-app-width);
  width: 100%;
`;

const CornerLabel = styled.span`
  color: #7dc69c;
  font-weight: 500;
`;

const SwipeLabel = styled.p`
  font-style: italic;
`;

const TurnArrowContainer = styled.span`
  display: inline-block;
  margin-right: 0.25rem;
`;

const TurnArrowStyled = styled(TurnArrow)`
  margin-bottom: -10px;
`;

const UlStyled = styled.ul`
  list-style: disc;
  padding-left: 0.75rem;
`;

const HRule = styled.div`
  height: 1px;
  background: var(--primary-text);
  opacity: 0.25;
  width: 100%;
`;

const CloseModalContainer = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
`;

const BlurLayer = styled.div`
  position: absolute;
  inset: 0px;
  top: 0px;
  bottom: 0px;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
`;

export type MenuWrapperProps = {
  children?: ReactNode;
  centerLabel?: string;
  autoNextEnabled?: boolean;
  autocheckEnabled?: boolean;
  draftModeEnabled?: boolean;
  rotatingBoxProps?: RotatingBoxProps;
  onAutoNextChanged?: (autoNextEnabled: boolean) => void;
  onAutocheckChanged?: (autocheckEnabled: boolean) => void;
  onDraftModeChanged?: (draftModeEnabled: boolean) => void;
  onSignUpPressed?: () => void;
  onSignInPressed?: () => void;
  onSignOutPressed?: () => void;
};

const MenuWrapper: React.FC<MenuWrapperProps> = ({
  children,
  centerLabel,
  autoNextEnabled,
  autocheckEnabled,
  draftModeEnabled,
  rotatingBoxProps,
  onSignUpPressed,
  onSignOutPressed,
  onSignInPressed,
  onAutoNextChanged,
  onAutocheckChanged,
  onDraftModeChanged,
}) => {
  const { theme, setTheme } = useTheme();

  const { isSignedIn, user } = useUser();
  const headerRef = useRef<HTMLDivElement>(null);
  const { height = 0 } = useResizeObserver({
    ref: headerRef,
    box: 'border-box',
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const handleMenuPressed = useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);
  const handleAutoNextTogglePressed = useCallback(() => {
    if (onAutoNextChanged) {
      onAutoNextChanged(!autoNextEnabled);
    }
  }, [autoNextEnabled, onAutoNextChanged]);
  const handleClickOutside = useCallback(() => {
    setIsMenuOpen(false);
  }, []);
  useOnClickOutside(menuRef, handleClickOutside);

  const handleThemePressed = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    setIsMenuOpen(false);
  }, [setTheme, theme]);

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const getGravatar = async () => {
      if (user?.primaryEmailAddress?.emailAddress == null) return '';
      const emailHash = md5(user.primaryEmailAddress.emailAddress);
      const response = await fetch(
        `https://www.gravatar.com/avatar/${emailHash}?d=404`,
      );
      if (response.ok) {
        const data = await response.blob();
        setAvatarUrl(URL.createObjectURL(data));
      }
    };

    getGravatar();
  }, [user?.primaryEmailAddress?.emailAddress]);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const toggleModal = useCallback(() => {
    setShowHelpModal(!showHelpModal);
    setIsMenuOpen(false);
  }, [showHelpModal]);

  return (
    <Main>
      <HeaderContainer ref={headerRef}>
        <HeaderStyled
          onMenuPressed={handleMenuPressed}
          showCloseButton={isMenuOpen}
          centerLabel={centerLabel}
          rotatingBoxProps={rotatingBoxProps}
          autocheckEnabled={autocheckEnabled}
          onAutocheckChanged={onAutocheckChanged}
          draftModeEnabled={draftModeEnabled}
          onDraftModeChanged={onDraftModeChanged}
        />
      </HeaderContainer>
      <Container>
        <ChildrenContainer $headerHeight={height}>{children}</ChildrenContainer>
        {isMenuOpen && <BlurLayer />}
        <AnimatePresence>
          {isMenuOpen && (
            <ClipContainer>
              <MenuContainer
                ref={menuRef}
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                exit={{ x: '-100%' }}
                transition={{
                  ease: 'easeInOut',
                  duration: 0.1,
                }}
                $headerHeight={height}
              >
                <MenuItemsContainer>
                  <MenuItemFlex onClick={handleMenuPressed}>
                    <IconX width={20} height={25} />
                    <div>Close</div>
                  </MenuItemFlex>
                  <Switch
                    color="default"
                    isSelected={autoNextEnabled}
                    onValueChange={handleAutoNextTogglePressed}
                  >
                    Jump to next word
                  </Switch>
                  <Switch
                    color="default"
                    isSelected={theme === 'dark'}
                    onValueChange={handleThemePressed}
                  >
                    Mode
                  </Switch>
                  <HRule />
                  <Link color="foreground" href="/">
                    Home
                  </Link>
                  <Link color="foreground" onClick={toggleModal}>
                    How to Play
                  </Link>
                  <HRule />
                  {isSignedIn === false && (
                    <>
                      <MenuItem>
                        <Link color="foreground" onClick={onSignInPressed}>
                          Sign In
                        </Link>
                        <span className="opacity-50 px-1 text-lg"> / </span>
                        <Link color="foreground" onClick={onSignUpPressed}>
                          Sign Up
                        </Link>
                      </MenuItem>
                      <HRule />
                    </>
                  )}
                  <MenuItem>
                    <Link color="foreground" href="mailto:info@crosscube.com">
                      Give Feedback
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      color="foreground"
                      target="_blank"
                      href="https://organic-icicle-eb4.notion.site/Terms-of-Service-79ef0a4a094f4f929a1ea31cf56a7499?pvs=4"
                    >
                      Terms of Service
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      color="foreground"
                      target="_blank"
                      href="https://organic-icicle-eb4.notion.site/Privacy-Policy-4b3d620031254ea5915660ac55d2efcd?pvs=4"
                    >
                      Privacy Policy
                    </Link>
                  </MenuItem>
                </MenuItemsContainer>
                <div>
                  {isSignedIn === true && (
                    <>
                      <Divider />
                      <SignInContainer>
                        <UserInfoStyled
                          name={user.fullName ?? ''}
                          email={user.primaryEmailAddress?.emailAddress ?? ''}
                          src={avatarUrl}
                        />
                        <Button
                          size="sm"
                          variant="bordered"
                          onClick={onSignOutPressed}
                        >
                          Log Out
                        </Button>
                      </SignInContainer>
                    </>
                  )}
                </div>
              </MenuContainer>
            </ClipContainer>
          )}
        </AnimatePresence>
        {/** Modal content below */}
        {showHelpModal && (
          <ModalContainer onClick={toggleModal}>
            <ModalContent>
              <CloseModalContainer>
                <FontAwesomeIcon icon={faClose} size="xl" />
              </CloseModalContainer>
              <h1>How to play Crosscube</h1>
              <h2>A crossword puzzle in 3 dimensions</h2>
              <Center>
                <ExampleCube height={125} width={225} />
              </Center>
              <UlStyled>
                <li>There are four sides.</li>
                <li>
                  <CornerLabel>Corners</CornerLabel> share the same letter.
                </li>
                <li>
                  Change sides with the{' '}
                  <TurnArrowContainer>
                    <TurnArrowStyled
                      color="#999999"
                      flipped
                      height={25}
                      width={25}
                    />{' '}
                  </TurnArrowContainer>
                  keys.
                  <SwipeLabel>(or swipe)</SwipeLabel>
                </li>
                <li>Solve all of the clues to win!</li>
              </UlStyled>
            </ModalContent>
          </ModalContainer>
        )}
      </Container>
    </Main>
  );
};

export default MenuWrapper;
