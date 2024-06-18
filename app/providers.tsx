'use client';

import StyledComponentsRegistry from 'lib/registry';
import { ThemeProvider } from 'lib/utils/hooks/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider>{children}</ThemeProvider>
    </StyledComponentsRegistry>
  );
}
