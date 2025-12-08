import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PromoCode } from '@/hooks/usePromoCode';

interface PromoCodeState {
  appliedCode: PromoCode | null;
  setAppliedCode: (code: PromoCode | null) => void;
  clearPromoCode: () => void;
}

export const usePromoCodeStore = create<PromoCodeState>()(
  persist(
    (set) => ({
      appliedCode: null,
      setAppliedCode: (code) => set({ appliedCode: code }),
      clearPromoCode: () => set({ appliedCode: null }),
    }),
    {
      name: 'promo-code-storage',
    }
  )
);



