import React, { useCallback } from 'react';
import MenuWrapper, { MenuWrapperProps } from 'components/core/Menu';
import { useClerk } from '@clerk/nextjs';

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
  onSignInPressed,
  showBackground = true,
}) => {
  const { signOut } = useClerk();
  const onSignOut = useCallback(() => {
    signOut({ redirectUrl: '/' });
  }, [signOut]);

  return (
    <MenuWrapper
      showBackground={showBackground}
      centerLabel={centerLabel}
      autocheckEnabled={autocheckEnabled}
      onAutocheckChanged={onAutocheckChanged}
      onSignOutPressed={onSignOut}
      onSignInPressed={onSignInPressed}
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
