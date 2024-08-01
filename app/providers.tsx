'use client';

import { UserConfigStoreProvider } from 'lib/providers/user-config-provider';
import StyledComponentsRegistry from 'lib/registry';
import { UserConfigState } from 'lib/stores/user-config';
import { ThemeProvider } from 'lib/utils/hooks/theme';

export function Providers({
  children,
  userConfig,
}: {
  children: React.ReactNode;
  userConfig: UserConfigState;
}) {
  return (
    <UserConfigStoreProvider initialState={userConfig}>
      <StyledComponentsRegistry>
        <ThemeProvider>{children}</ThemeProvider>
      </StyledComponentsRegistry>
    </UserConfigStoreProvider>
  );
}
