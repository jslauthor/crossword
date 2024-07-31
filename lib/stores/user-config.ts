import { createStore } from 'zustand/vanilla';

export type UserConfigState = {
  isSubscribed: boolean;
  showSettings: boolean;
};

export type UserConfigActions = {
  updateSubscription: (isSubscribed: boolean) => Promise<void>;
  toggleSettings: (val: boolean) => void;
};

export type UserConfigStore = UserConfigState & UserConfigActions;

export const createUserConfigStore = (
  initialState: UserConfigState = { isSubscribed: false, showSettings: false },
) => {
  return createStore<UserConfigStore>((set) => ({
    ...initialState,
    updateSubscription: async (isSubscribed) => {
      // Call loops API to update subscription
      // Replace the following code with your actual API call
      const response = await fetch('/api/subscription', {
        method: 'PUT',
        body: JSON.stringify({ isSubscribed }),
      });

      if (response.ok) {
        const data = await response.json();
        set({ isSubscribed: data.isSubscribed });
        console.log('Subscription updated successfully:', data);
      }
    },
    toggleSettings: (val) => set({ showSettings: val }),
  }));
};
