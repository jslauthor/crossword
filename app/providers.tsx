'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

import { UserConfigStoreProvider } from 'lib/providers/user-config-provider';
import StyledComponentsRegistry from 'lib/registry';
import { UserConfigState } from 'lib/stores/user-config';
import { ThemeProvider } from 'lib/utils/hooks/theme';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? '',
    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
  });
}

export function Providers({
  children,
  userConfig,
}: {
  children: React.ReactNode;
  userConfig: UserConfigState;
}) {
  return (
    <PostHogProvider client={posthog}>
      <UserConfigStoreProvider initialState={userConfig}>
        <StyledComponentsRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </StyledComponentsRegistry>
      </UserConfigStoreProvider>
    </PostHogProvider>
  );
}
