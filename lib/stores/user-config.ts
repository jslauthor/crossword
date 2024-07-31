import { Toast } from 'components/core/ui/use-toast';
import debounce from 'lodash.debounce';
import { createStore } from 'zustand/vanilla';

export type UserConfigState = {
  isSubscribed: boolean;
  showSettings: boolean;
  isLoading?: boolean;
};

export type UserConfigActions = {
  subcribe: () => void;
  updateSubscription: (isSubscribed: boolean) => Promise<void>;
  toggleSettings: (val: boolean) => void;
};

export type UserConfigStore = UserConfigState & UserConfigActions;

export const createUserConfigStore = (
  initialState: UserConfigState = {
    isSubscribed: false,
    showSettings: false,
    isLoading: false,
  },
  toast: (toast: Toast) => void,
) => {
  return createStore<UserConfigStore>((set, get) => ({
    ...initialState,
    updateSubscription: async (isSubscribed) => {
      if (get().isLoading) return;

      const previousState = get().isSubscribed;
      set({ isSubscribed: isSubscribed, isLoading: true });
      // Call loops API to update subscription
      // Replace the following code with your actual API call
      const response = await fetch('/api/subscription', {
        method: 'PUT',
        body: JSON.stringify({ isSubscribed }),
      });

      if (response.ok) {
        const data = await response.json();
        set({ isSubscribed: data.isSubscribed, isLoading: false });
      } else {
        set({ isSubscribed: previousState, isLoading: false });
        toast({
          title: 'Failure!',
          description: 'Could not update subscription',
          variant: 'destructive',
        });
      }
    },
    subcribe: () => {
      set({ showSettings: true });
      get().updateSubscription(true);
    },
    toggleSettings: (val) => set({ showSettings: val }),
  }));
};
