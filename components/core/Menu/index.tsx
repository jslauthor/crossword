'use client';

import React, { ReactNode, use, useEffect, useRef } from 'react';
import md5 from 'md5';
import Header from 'components/core/Header';
import styled from 'styled-components';
import { useCallback, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useOnClickOutside, useResizeObserver } from 'usehooks-ts';
import UserInfo from 'components/composed/UserInfo';
import { AnimatePresence, motion } from 'framer-motion';
import { RotatingBoxProps } from '../3d/Box';
import TurnArrow from 'components/svg/TurnArrow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faHome } from '@fortawesome/free-solid-svg-icons';
import IconX from 'components/svg/IconX';
import { HRule } from '../Dividers';
import { Button } from '../ui/button';
import { useTheme } from 'lib/utils/hooks/theme';
import { getColorHex } from 'lib/utils/color';
import Image from 'next/image';
import Link from 'next/link';
import { useUserConfigStore } from 'lib/providers/user-config-provider';
import UserSettings from 'components/composed/UserSettings';
import Gear from 'components/svg/Gear';

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
  padding: 0.75rem;
`;

const Container = styled.div`
  position: relative;
  background-color: hsl(var(--background));
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
  inset: 0;
  overflow: hidden;
  display: flex;
  justify-content: stretch;
`;

const MenuContainer = styled(motion.nav)<{ $headerHeight: number }>`
  position: absolute;
  display: flex;
  flex-direction: column;
  background-color: hsl(var(--background));
  max-width: 300px;
  width: 100%;
  height: 100%;
  box-shadow:
    4px 16px 16px 0px rgba(0, 0, 0, 0.25),
    4px 4px 4px 0px rgba(0, 0, 0, 0.1);
`;

const MenuItem = styled.div<{ $accent?: boolean }>`
  font-size: 1rem;
  padding: 0.5rem 1rem;
  ${({ $accent }) =>
    $accent
      ? 'background-color: rgba(0,0,0,0.03); border-left: 3px solid black;'
      : 'none'};
`;

const MenuItemFlex = styled(MenuItem)`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const SignInContainer = styled.div`
  display: flex;
  padding: 1rem;
  gap: 0.75rem;
  flex-direction: column;
  justify-content: stretch;
`;

const MenuHeader = styled.div`
  text-transform: uppercase;
  font-weight: 600;
`;

const MenuItemsContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 0;
  padding-top: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
`;

const MenuItemGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem;
`;

const ModalContainer = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  inset: 0;
  background: rgb(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const ModalContent = styled.div`
  position: relative;
  display: grid;
  grid-auto-flow: row;
  gap: 0.75rem;
  margin: 1rem;
  padding: 1rem;
  padding-top: 1rem;
  background: hsl(var(--card));
  border-radius: 0.5rem;
  max-width: var(--primary-app-width);
  width: 100%;
`;

const CornerLabel = styled.span`
  color: hsl(var(--primary));
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

const BlurLayer = styled.div`
  position: absolute;
  inset: 0px;
  top: 0px;
  bottom: 0px;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
`;

const PointerLink = styled.a`
  cursor: pointer;
`;

export type MenuWrapperProps = {
  children?: ReactNode;
  centerLabel?: string | ReactNode;
  autocheckEnabled?: boolean;
  draftModeEnabled?: boolean;
  rotatingBoxProps?: RotatingBoxProps;
  onAutocheckChanged?: (autocheckEnabled: boolean) => void;
  onDraftModeChanged?: (draftModeEnabled: boolean) => void;
  onSignInPressed: () => void;
  onSignOutPressed?: () => void;
  onSettingsPressed?: () => void;
  onDisplayChange?: (isMenuOpen: boolean) => void;
};

const MenuWrapper: React.FC<MenuWrapperProps> = ({
  children,
  centerLabel,
  autocheckEnabled,
  draftModeEnabled,
  rotatingBoxProps,
  onSignOutPressed,
  onSignInPressed,
  onAutocheckChanged,
  onDraftModeChanged,
  onSettingsPressed,
  onDisplayChange,
}) => {
  const isSubscribed = useUserConfigStore((store) => store.isSubscribed);
  const showSettings = useUserConfigStore((store) => store.showSettings);
  const toggleSettings = useUserConfigStore((store) => store.toggleSettings);
  const updateSubscription = useUserConfigStore(
    (store) => store.updateSubscription,
  );
  const handleUpdateSubscription = useCallback(
    (val: boolean) => {
      updateSubscription(val);
    },
    [updateSubscription],
  );
  const handleOpenSettings = useCallback(() => {
    toggleSettings(true);
  }, [toggleSettings]);

  const { colors } = useTheme();

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

  const handleClickOutside = useCallback(() => {
    if (showSettings) return;
    setIsMenuOpen(false);
  }, [showSettings]);
  useOnClickOutside(menuRef, handleClickOutside);

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

  useEffect(() => {
    if (onDisplayChange) {
      onDisplayChange(isMenuOpen || showHelpModal);
    }
  }, [onDisplayChange, isMenuOpen, showHelpModal]);

  return (
    <Main>
      <Container>
        {height > 0 && (
          <ChildrenContainer $headerHeight={height}>
            {children}
          </ChildrenContainer>
        )}
        {(isMenuOpen || showHelpModal) && <BlurLayer />}

        <HeaderContainer
          ref={headerRef}
          className="border-b border-solid border-foreground/10 relative"
        >
          <div className="absolute inset-0 bg-background z-0" />
          <Header
            className="z-10 w-full relative"
            onMenuPressed={handleMenuPressed}
            showCloseButton={isMenuOpen}
            centerLabel={centerLabel}
            rotatingBoxProps={rotatingBoxProps}
            autocheckEnabled={autocheckEnabled}
            onAutocheckChanged={onAutocheckChanged}
            draftModeEnabled={draftModeEnabled}
            onDraftModeChanged={onDraftModeChanged}
            onSettingsPressed={onSettingsPressed}
          />
        </HeaderContainer>
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
                  <div className="flex flex-col gap-4">
                    <MenuItemFlex onClick={handleMenuPressed}>
                      <IconX width={12} height={12} />
                    </MenuItemFlex>
                    <HRule />
                  </div>
                  <Link href="/">
                    <MenuItemFlex $accent>
                      <FontAwesomeIcon icon={faHome} size="1x" />
                      Latest
                    </MenuItemFlex>
                  </Link>
                  <MenuItemGroup>
                    <MenuHeader>Games</MenuHeader>
                    <Link href="/crosscube/moji">
                      <div className="flex gap-2 items-center">
                        <Image
                          className="rounded-md"
                          alt="Crossmoji Icon"
                          src="/moji_icon.png"
                          width={24}
                          height={24}
                        />
                        Crossmoji
                      </div>
                    </Link>
                    <Link href="/crosscube/mini">
                      <div className="flex gap-2 items-center">
                        <Image
                          className="rounded-md"
                          alt="Crossmoji Icon"
                          src="/mini_icon.png"
                          width={24}
                          height={24}
                        />
                        Crosscube mini
                      </div>
                    </Link>
                    <Link href="/crosscube/cube">
                      <div className="flex gap-2 items-center">
                        <Image
                          className="rounded-md"
                          alt="Crossmoji Icon"
                          src="/crosscube_icon.png"
                          width={24}
                          height={24}
                        />
                        Crosscube
                      </div>
                    </Link>
                    <Link href="/crosscube/mega">
                      <div className="flex gap-2 items-center">
                        <Image
                          className="rounded-md"
                          alt="Crossmoji Icon"
                          src="/mega_icon.png"
                          width={24}
                          height={24}
                        />
                        Crosscube MEGA
                      </div>
                    </Link>
                  </MenuItemGroup>
                  <HRule />
                  <MenuItemGroup>
                    <MenuHeader>TIPS AND TRICKS</MenuHeader>
                    <PointerLink onClick={toggleModal}>How to Play</PointerLink>
                  </MenuItemGroup>
                  <HRule />
                  <MenuItemGroup>
                    <PointerLink href="mailto:info@crosscube.com">
                      Give Feedback
                    </PointerLink>
                    <PointerLink
                      color="foreground"
                      target="_blank"
                      href="https://organic-icicle-eb4.notion.site/Terms-of-Service-79ef0a4a094f4f929a1ea31cf56a7499?pvs=4"
                    >
                      Terms of Service
                    </PointerLink>
                    <PointerLink
                      color="foreground"
                      target="_blank"
                      href="https://organic-icicle-eb4.notion.site/Privacy-Policy-4b3d620031254ea5915660ac55d2efcd?pvs=4"
                    >
                      Privacy Policy
                    </PointerLink>
                    <PointerLink href="/credits">Credits</PointerLink>
                  </MenuItemGroup>
                </MenuItemsContainer>
                <div>
                  {isSignedIn === false && (
                    <>
                      <HRule $heavy />
                      <SignInContainer>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onSignInPressed}
                        >
                          Sign In / Sign Up
                        </Button>
                      </SignInContainer>
                    </>
                  )}
                  {isSignedIn === true && (
                    <>
                      <HRule $heavy />
                      <SignInContainer>
                        <UserInfo
                          name={user.fullName ?? ''}
                          email={user.primaryEmailAddress?.emailAddress ?? ''}
                          src={avatarUrl}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleOpenSettings}
                        >
                          Settings
                          <Gear className="ml-1" height={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
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
              <ModalHeader>
                <h1>How to play Crosscube</h1>
                <FontAwesomeIcon icon={faClose} size="xl" />
              </ModalHeader>
              <h2>A crossword puzzle in 3 dimensions</h2>
              <UlStyled>
                <li>There are four sides.</li>
                <li>
                  <CornerLabel>Corners</CornerLabel> share the same letter.
                </li>
                <li>
                  Change sides with the{' '}
                  <TurnArrowContainer>
                    <TurnArrowStyled
                      color={getColorHex(colors.selectedAdjacent)}
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
      <UserSettings
        isOpen={showSettings}
        onOpenChange={toggleSettings}
        isSubscribed={isSubscribed}
        onSubscribedChange={handleUpdateSubscription}
      />
    </Main>
  );
};

export default MenuWrapper;
