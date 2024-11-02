import React, { useCallback } from 'react';
import MenuWrapper, { MenuWrapperProps } from 'components/core/Menu';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface MenuProps extends Omit<MenuWrapperProps, 'onSignInPressed'> {}

const Menu: React.FC<MenuProps> = ({
  centerLabel,
  rightContent,
  children,
  onDisplayChange,
  showBackground = true,
}) => {
  const router = useRouter();
  const onSignIn = useCallback(() => {
    router.push(`/signin?redirect_url=${window.location.href}`);
  }, [router]);

  const { signOut } = useClerk();
  const onSignOut = useCallback(() => {
    signOut({ redirectUrl: '/' });
  }, [signOut]);

  return (
    <MenuWrapper
      showBackground={showBackground}
      centerLabel={centerLabel}
      rightContent={rightContent}
      onSignOutPressed={onSignOut}
      onSignInPressed={onSignIn}
      onDisplayChange={onDisplayChange}
    >
      {children}
    </MenuWrapper>
  );
};

export default Menu;
