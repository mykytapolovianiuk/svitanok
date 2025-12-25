import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useAnalytics } from './useAnalytics';
import { usePromoCodeStore } from '@/store/promoCodeStore';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  description: string | null;
}

interface UsePromoCodeResult {
  appliedCode: PromoCode | null;
  discount: number;
  discountAmount: number;
  isLoading: boolean;
  applyCode: (code: string, orderTotal: number) => Promise<boolean>;
  removeCode: () => void;
  validateCode: (code: string, orderTotal: number) => Promise<{ valid: boolean; error?: string; promoCode?: PromoCode }>;
  calculateDiscount: (orderTotal: number) => number;
}

const STORAGE_KEY = 'applied_promo_code';


export function usePromoCode(): UsePromoCodeResult {
  const { appliedCode, setAppliedCode, clearPromoCode } = usePromoCodeStore();
  const [isLoading, setIsLoading] = useState(false);
  const { trackUIInteraction } = useAnalytics();

  
  useEffect(() => {
    const savedCode = localStorage.getItem(STORAGE_KEY);
    if (savedCode && !appliedCode) {
      try {
        const parsed = JSON.parse(savedCode);
        setAppliedCode(parsed);
      } catch (error) {
        console.error('Error loading saved promo code:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [appliedCode, setAppliedCode]);

  
  const validateCode = async (
    code: string,
    orderTotal: number
  ): Promise<{ valid: boolean; error?: string; promoCode?: PromoCode }> => {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: 'Введіть промокод' };
    }

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { valid: false, error: 'Промокод не знайдено або неактивний' };
      }

      const promoCode = data as PromoCode;

      
      const now = new Date();
      if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
        return { valid: false, error: 'Промокод ще не активний' };
      }
      if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
        return { valid: false, error: 'Промокод вже недійсний' };
      }

      
      if (orderTotal < promoCode.min_order_amount) {
        return {
          valid: false,
          error: `Мінімальна сума замовлення для цього промокоду: ${promoCode.min_order_amount.toFixed(2)} ₴`,
        };
      }

      
      if (promoCode.max_uses !== null && promoCode.used_count >= promoCode.max_uses) {
        return { valid: false, error: 'Промокод вже використано максимальну кількість разів' };
      }

      return { valid: true, promoCode };
    } catch (error: any) {
      console.error('Error validating promo code:', error);
      return { valid: false, error: 'Помилка перевірки промокоду. Спробуйте ще раз.' };
    }
  };

  
  const applyCode = async (code: string, orderTotal: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const validation = await validateCode(code, orderTotal);

      if (!validation.valid || !validation.promoCode) {
        toast.error(validation.error || 'Промокод недійсний');
        trackUIInteraction('promo_code', 'apply_failed', code);
        return false;
      }

      const promoCode = validation.promoCode;

      
      if (appliedCode?.code === promoCode.code) {
        toast.error('Цей промокод вже застосовано');
        return false;
      }

      setAppliedCode(promoCode);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(promoCode));
      
      toast.success('Промокод успішно застосовано!');
      trackUIInteraction('promo_code', 'apply_success', promoCode.code);
      
      return true;
    } catch (error: any) {
      console.error('Error applying promo code:', error);
      toast.error('Помилка застосування промокоду. Спробуйте ще раз.');
      trackUIInteraction('promo_code', 'apply_error', code);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  
  const removeCode = () => {
    if (appliedCode) {
      trackUIInteraction('promo_code', 'remove', appliedCode.code);
    }
    clearPromoCode();
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Промокод видалено');
  };

  
  const calculateDiscount = (orderTotal: number): number => {
    const currentCode = usePromoCodeStore.getState().appliedCode;
    if (!currentCode) return 0;
    
    return currentCode.discount_type === 'percentage'
      ? (orderTotal * currentCode.discount_value) / 100
      : Math.min(currentCode.discount_value, orderTotal);
  };
  
  return {
    appliedCode, 
    discount: 0, 
    discountAmount: 0, 
    isLoading,
    applyCode,
    removeCode,
    validateCode,
    calculateDiscount, 
  };
}


export function usePromoCodeDiscount(orderTotal: number) {
  const appliedCode = usePromoCodeStore((state) => state.appliedCode);
  
  
  const discountAmount = useMemo(() => {
    if (!appliedCode) return 0;
    
    return appliedCode.discount_type === 'percentage'
      ? (orderTotal * appliedCode.discount_value) / 100
      : Math.min(appliedCode.discount_value, orderTotal);
  }, [appliedCode, orderTotal]);

  const finalTotal = useMemo(() => {
    return Math.max(0, orderTotal - discountAmount);
  }, [orderTotal, discountAmount]);

  return {
    discountAmount,
    finalTotal,
    appliedCode,
  };
}

