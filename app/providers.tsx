'use client';

import { NextUIProvider } from '@nextui-org/react';
import StyledComponentsRegistry from 'lib/registry';
import { ThemeProvider } from 'lib/utils/hooks/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <NextUIProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </NextUIProvider>
    </StyledComponentsRegistry>
  );
}
