import create from 'zustand';

import { analytics } from '~/analytics';
import { event } from '~/analytics/event';
import { createStore } from '~/core/state/internal/createStore';

export interface FlashbotsEnabledState {
  flashbotsEnabled: boolean;
  setFlashbotsEnabled: (flashbotsEnabled: boolean) => void;
  swapFlashbotsEnabled: boolean;
  setSwapFlashbotsEnabled: (newSwapFlashbotsEnabled: boolean) => void;
}

export const flashbotsEnabledStore = createStore<FlashbotsEnabledState>(
  (set) => ({
    flashbotsEnabled: false,
    setFlashbotsEnabled: (newFlashbotsEnabled) => {
      analytics.track(
        newFlashbotsEnabled
          ? event.settingsFlashbotsEnabled
          : event.settingsFlashbotsDisabled,
      );
      set({ flashbotsEnabled: newFlashbotsEnabled });
      // swapFlashbotsEnabled is just a way to override when flashbotsEnabledGlobally is false
      // specifically for the swap page
      // so if we enable it globally we can just set it to true
      if (newFlashbotsEnabled) set({ swapFlashbotsEnabled: true });
    },
    swapFlashbotsEnabled: false,
    setSwapFlashbotsEnabled: (newSwapFlashbotsEnabled) =>
      set({ swapFlashbotsEnabled: newSwapFlashbotsEnabled }),
  }),
  {
    persist: {
      name: 'flashbotsEnabled',
      version: 1,
      migrate(_persistedState, version) {
        const persistedState = _persistedState as FlashbotsEnabledState;
        if (version === 0)
          return {
            ...persistedState,
            swapFlashbotsEnabled: persistedState.flashbotsEnabled,
          };
        return persistedState;
      },
    },
  },
);

export const useFlashbotsEnabledStore = create(flashbotsEnabledStore);
