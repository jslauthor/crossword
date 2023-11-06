import React, { ReactNode, useCallback } from 'react';
import MenuWrapper, { MenuWrapperProps } from 'components/core/Menu';
import { useClerk } from '@clerk/nextjs';

interface MenuProps extends MenuWrapperProps {}

const Menu: React.FC<MenuProps> = ({ centerLabel, children }) => {
  const { signOut } = useClerk();
  const onSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  return (
    <MenuWrapper centerLabel={centerLabel} onSignOutPressed={onSignOut}>
      {children}
    </MenuWrapper>
  );
};

export default Menu;
