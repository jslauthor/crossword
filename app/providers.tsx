'use client';

import { NextUIProvider } from '@nextui-org/react';
import StyledComponentsRegistry from 'lib/registry';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <NextUIProvider>{children}</NextUIProvider>
    </StyledComponentsRegistry>
  );
}
