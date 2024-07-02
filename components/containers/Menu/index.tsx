import React, { useCallback } from 'react';
import MenuWrapper, { MenuWrapperProps } from 'components/core/Menu';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface MenuProps extends MenuWrapperProps {}

const Menu: React.FC<MenuProps> = ({
  centerLabel,
  autocheckEnabled,
  onAutocheckChanged,
  draftModeEnabled,
  onDraftModeChanged,
  rotatingBoxProps,
  children,
  onSettingsPressed,
  onDisplayChange,
}) => {
  const router = useRouter();
  const { signOut } = useClerk();
  const onSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  const onSignIn = useCallback(() => {
    router.push(`/signin?redirect_url=${window.location.href}`);
  }, [router]);

  const onSignUp = useCallback(() => {
    router.push(`/signup?redirect_url=${window.location.href}`);
  }, [router]);

  return (
    <MenuWrapper
      centerLabel={centerLabel}
      autocheckEnabled={autocheckEnabled}
      onAutocheckChanged={onAutocheckChanged}
      onSignOutPressed={onSignOut}
      onSignUpPressed={onSignUp}
      onSignInPressed={onSignIn}
      rotatingBoxProps={rotatingBoxProps}
      draftModeEnabled={draftModeEnabled}
      onDraftModeChanged={onDraftModeChanged}
      onSettingsPressed={onSettingsPressed}
      onDisplayChange={onDisplayChange}
    >
      {children}
    </MenuWrapper>
  );
};

export default Menu;
