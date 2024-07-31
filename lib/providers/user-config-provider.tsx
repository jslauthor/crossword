'use client';

import { type ReactNode, createContext, useContext, useState } from 'react';
import { useStore } from 'zustand';

import {
  type UserConfigState,
  type UserConfigStore,
  createUserConfigStore,
} from 'lib/stores/user-config';

export type UserConfigStoreApi = ReturnType<typeof createUserConfigStore>;

export const UserConfigStoreContext = createContext<
  UserConfigStoreApi | undefined
>(undefined);

export interface UserConfigStoreProviderProps {
  initialState?: UserConfigState;
  children: ReactNode;
}

export const UserConfigStoreProvider = ({
  initialState,
  children,
}: UserConfigStoreProviderProps) => {
  const [store] = useState(() => createUserConfigStore(initialState));
  return (
    <UserConfigStoreContext.Provider value={store}>
      {children}
    </UserConfigStoreContext.Provider>
  );
};

export const useUserConfigStore = <T,>(
  selector: (store: UserConfigStore) => T,
): T => {
  const userConfigContext = useContext(UserConfigStoreContext);

  if (!userConfigContext) {
    throw new Error(
      `useUserConfigStore must be used within UserConfigStoreProvider`,
    );
  }

  return useStore(userConfigContext, selector);
};
