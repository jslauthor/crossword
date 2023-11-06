import React, { ReactNode, useCallback } from 'react';
import MenuWrapper, { MenuWrapperProps } from 'components/core/Menu';
import { useClerk } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';

interface MenuProps extends MenuWrapperProps {}

const Menu: React.FC<MenuProps> = ({ centerLabel, children }) => {
  const router = useRouter();
  const { signOut } = useClerk();
  const onSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  const onSignIn = useCallback(() => {
    router.push(`/signin?redirect_url=${window.location.href}`);
  }, [router]);

  const onSignUp = useCallback(() => {
    router.push('/signup?redirect_url=${window.location.href}');
  }, [router]);

  return (
    <MenuWrapper
      centerLabel={centerLabel}
      onSignOutPressed={onSignOut}
      onSignUpPressed={onSignUp}
      onSignInPressed={onSignIn}
    >
      {children}
    </MenuWrapper>
  );
};

export default Menu;
