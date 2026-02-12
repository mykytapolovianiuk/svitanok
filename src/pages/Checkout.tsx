import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast'; // Added toast import
import { useCartStore, useCartTotalPrice } from '@/store/cartStore';
import { useUserStore } from '@/features/auth/useUserStore';
import { useAnalytics, formatCartItemsForAnalytics } from '@/hooks/useAnalytics';
import { usePromoCode } from '@/hooks/usePromoCode';
import AsyncSelect from '@/components/ui/AsyncSelect';
import { searchSettlements, getWarehouses, CityOption, WarehouseOption } from '@/services/novaPoshta';
import LiqPayRedirect from '@/components/checkout/LiqPayRedirect';
import { X, Plus, Minus, Check, Tag } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

// Schema Validation
const checkoutSchema = z.object({
  firstName: z.string().min(1, "Введіть ім'я"),
  lastName: z.string().min(1, 'Введіть прізвище'),
  phone: z.string().length(12, 'Номер телефону має містити 12 цифр').regex(/^380\d{9}$/, 'Номер телефону має починатися з 380 і містити 9 цифр після коду'),
  email: z.string().email('Невірний формат email').or(z.literal('')),
  deliveryMethod: z.enum(['nova-poshta', 'courier', 'self-pickup']),
  city: z.string().optional(),
  cityRef: z.string().optional(),
  warehouse: z.string().optional(),
  warehouseRef: z.string().optional(),
  address: z.string().optional(),
  paymentMethod: z.enum(['cash-on-delivery', 'liqpay', 'monobank-card', 'monobank-parts']),
  partsCount: z.number().min(3).max(24).optional(),
  comment: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

/**
 * Форма оформлення замовлення
 * Обробляє введення даних користувача, доставку та оплату
 */
export default function Checkout() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity } = useCartStore();
  const baseTotalPrice = useCartTotalPrice();
  const { session } = useUserStore();
  const { trackBeginCheckout, trackAddPaymentInfo, trackAddShippingInfo, trackPurchase } = useAnalytics();
  const { appliedCode, isLoading: promoLoading, applyCode, removeCode } = usePromoCode();

  // Константа для безкоштовної доставки
  const FREE_SHIPPING_THRESHOLD = 4000;
  // NOTE: Для Нової Пошти доставка тепер "За тарифами перевізника", тобто 0 у розрахунку чекауту
  const SHIPPING_COST = 0;

  // Розрахунок знижки та фінальної суми з правильними залежностями
  const discountAmount = useMemo(() => {
    if (!appliedCode) return 0;

    return appliedCode.discount_type === 'percentage'
      ? (baseTotalPrice * appliedCode.discount_value) / 100
      : Math.min(appliedCode.discount_value, baseTotalPrice);
  }, [appliedCode, baseTotalPrice]);

  const subtotal = useMemo(() => {
    return Math.max(0, baseTotalPrice - discountAmount);
  }, [baseTotalPrice, discountAmount]);

  // Розрахунок вартості доставки
  // Розрахунок вартості доставки
  // Завжди SHIPPING_COST (0), оскільки оплата за тарифами перевізника або самовивіз
  const shippingCost = SHIPPING_COST;

  const finalTotal = useMemo(() => {
    return subtotal + shippingCost;
  }, [subtotal, shippingCost]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingForSignature, setIsWaitingForSignature] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [showLiqPay, setShowLiqPay] = useState(false);
  const [liqPayOrderData, setLiqPayOrderData] = useState<{ orderId: string; amount: number; description: string } | null>(null);
  const [partsCount, setPartsCount] = useState<number>(3); // Default to 3 parts

  // State to store full objects
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseOption | null>(null);

  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);

  // Empty Cart Check
  useEffect(() => {
    if (!isSuccess && items.length === 0) navigate('/catalog');
  }, [items, navigate, isSuccess]);

  // Polling for Monobank Parts signature confirmation
  useEffect(() => {
    if (!isWaitingForSignature || !currentOrderId) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('payment_status')
          .eq('id', currentOrderId)
          .single();

        if (error) throw error;

        // If payment is confirmed, navigate to success
        if (data.payment_status === 'paid' || data.payment_status === 'success') {
          clearInterval(interval);
          setIsWaitingForSignature(false);
          setCurrentOrderId(null);
          // clearCart(); // Moved to success page
          navigate('/order-success', {
            state: {
              orderId: currentOrderId,
              shouldClearCart: true
            }
          });
        }
        // If payment failed, stop polling and show error
        else if (data.payment_status === 'failed') {
          clearInterval(interval);
          setIsWaitingForSignature(false);
          setCurrentOrderId(null);
          alert('Оплата скасована або не підтверджена у додатку Monobank');
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(interval);
    };
  }, [isWaitingForSignature, currentOrderId, navigate]);

  // Track begin checkout on mount
  const analyticsItems = useMemo(() => formatCartItemsForAnalytics(items), [items]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryMethod: 'nova-poshta',
      paymentMethod: 'cash-on-delivery',
      partsCount: 3,
    },
  });

  // Fetch profile for auto-fill (after useForm initialization)
  useEffect(() => {
    if (session?.user?.id) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && data) {
            // Auto-fill form fields
            if (data.full_name) {
              const nameParts = data.full_name.split(' ');
              if (nameParts.length >= 2) {
                setValue('firstName', nameParts[0]);
                setValue('lastName', nameParts.slice(1).join(' '));
              } else {
                setValue('firstName', data.full_name);
              }
            }
            if (data.phone) {
              setValue('phone', data.phone);
            }
            if (session.user.email) {
              setValue('email', session.user.email);
            }
          }
        } catch (error) {
          // Silently fail
          console.error('Error loading profile:', error);
        }
      })();
    }
  }, [session, setValue]);

  const deliveryMethod = watch('deliveryMethod');
  const paymentMethod = watch('paymentMethod');

  // Format phone number with 380 prefix
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'phone') {
        const phoneValue = value.phone || '';
        // Remove all non-digit characters
        const digitsOnly = phoneValue.replace(/\D/g, '');

        if (digitsOnly === '') {
          // Allow empty
          return;
        }

        let formattedPhone = digitsOnly;

        // Logic:
        // Type "0..." -> replace with "380..."
        // Type "80..." -> replace with "380..."
        // Type "380..." -> keep
        // Limit to 12 chars

        if (digitsOnly.startsWith('0')) {
          formattedPhone = '380' + digitsOnly.substring(1);
        } else if (digitsOnly.startsWith('80')) {
          formattedPhone = '380' + digitsOnly.substring(2);
        } else if (!digitsOnly.startsWith('38') && digitsOnly.length <= 10) {
          // Heuristic: if user types 9 digits (e.g. 99...) assume 38099...
          // But requirement says: "0..." -> "380...", "80..." -> "380...".
          // "380..." -> keep.
          // If they assume + is there and type 380, it's fine.
          // If they type just 99... we might want to wait or prepend 380.
          // Let's stick to the specific requirements first to avoid over-engineering.
          // If it doesn't start with 3, maybe prepend?
          // The prompt said: "If user types '380...', keep". "If user types '0...', auto-convert".
          if (!digitsOnly.startsWith('3')) {
            formattedPhone = '380' + digitsOnly;
          }
        }

        // Ensure it starts with 380 if length is sufficient to guess
        if (formattedPhone.length >= 3 && !formattedPhone.startsWith('380')) {
          if (formattedPhone.startsWith('80')) formattedPhone = '380' + formattedPhone.substring(2);
          else if (formattedPhone.startsWith('0')) formattedPhone = '380' + formattedPhone.substring(1);
        }

        // Limit to 12 digits
        if (formattedPhone.length > 12) {
          formattedPhone = formattedPhone.substring(0, 12);
        }

        // Update if changed
        if (formattedPhone !== phoneValue) {
          // ONLY UPDATE, DO NOT VALIDATE WHILE TYPING
          // Validation will happen on submit
          setValue('phone', formattedPhone, { shouldValidate: false });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  useEffect(() => {
    if (items.length > 0) {
      trackBeginCheckout(analyticsItems, finalTotal);
    }
  }, [items.length]); // Track on mount and when items change

  // Track payment method change
  useEffect(() => {
    if (paymentMethod && items.length > 0) {
      trackAddPaymentInfo(analyticsItems, finalTotal, paymentMethod === 'liqpay' ? 'liqpay' : 'cash');
    }
  }, [paymentMethod, analyticsItems, finalTotal, items.length]);

  // Track shipping method change
  useEffect(() => {
    if (deliveryMethod && items.length > 0) {
      const shippingTier = deliveryMethod === 'nova-poshta' ? 'nova_poshta' :
        deliveryMethod === 'courier' ? 'nova_poshta_courier' :
          'self_pickup';
      trackAddShippingInfo(analyticsItems, finalTotal, shippingTier);
    }
  }, [deliveryMethod, analyticsItems, finalTotal, items.length]);

  // Load Cities
  const loadCities = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2) return [];
    setIsLoadingCities(true);
    try {
      if (deliveryMethod === 'self-pickup') return [];
      // searchUkrposhtaCities removed
      return await searchSettlements(inputValue);
    } catch (error) {
      console.error('Error loading cities:', error);
      return [];
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Load warehouses when city is selected
  useEffect(() => {
    if (selectedCity?.ref) {
      setIsLoadingWarehouses(true);

      const loadWarehouses = async () => {
        try {
          let results: WarehouseOption[] = [];

          if (deliveryMethod === 'self-pickup') {
            results = [];
          } else {
            results = await getWarehouses(selectedCity.ref!);
          }

          setWarehouses(results);
          setSelectedWarehouse(null);
          setValue('warehouse', '');
          setValue('warehouseRef', '');
        } catch (error) {
          console.error('Error loading warehouses:', error);
        } finally {
          setIsLoadingWarehouses(false);
        }
      };

      loadWarehouses();
    } else {
      setWarehouses([]);
      setSelectedWarehouse(null);
      setValue('warehouse', '');
      setValue('warehouseRef', '');
    }
  }, [selectedCity, setValue, deliveryMethod]);

  // Handlers
  const handleCityChange = (option: CityOption | null) => {
    setSelectedCity(option);
    setValue('city', option?.label || '');
    setValue('cityRef', option?.ref || '');
  };

  const handleWarehouseChange = (option: WarehouseOption | null) => {
    setSelectedWarehouse(option);
    setValue('warehouse', option?.label || '');
    setValue('warehouseRef', option?.ref || '');
  };

  // Handle delivery method change (for tabs)
  const handleDeliveryMethodChange = (method: 'nova-poshta' | 'courier' | 'self-pickup') => {
    setValue('deliveryMethod', method);
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method: 'cash-on-delivery' | 'liqpay' | 'monobank-card' | 'monobank-parts') => {
    setValue('paymentMethod', method);
    // Reset parts count when switching away from parts payment
    if (method !== 'monobank-parts') {
      setValue('partsCount', 3);
    }
  };

  // Обробка замовлення: валідація -> база -> ТТН
  const onSubmit = async (data: CheckoutFormData) => {
    console.log('🚀 Початок оформлення замовлення:', data);

    setIsSubmitting(true);

    try {
      // 1. CRITICAL VALIDATION FOR DELIVERY METHODS
      // Manual Phone Length Check
      if (data.phone.replace(/\D/g, '').length !== 12) {
        toast.error('Будь ласка, перевірте номер телефону (має бути 12 цифр)');
        setIsSubmitting(false);
        return;
      }

      const finalCityRef = data.cityRef || selectedCity?.ref || '';
      const finalWarehouseRef = data.warehouseRef || selectedWarehouse?.ref || '';

      if ((deliveryMethod === 'nova-poshta') && !finalCityRef) {
        const deliveryName = 'Нової Пошти';
        alert(`Помилка: Не вдалося визначити код міста для ${deliveryName}. Спробуйте обрати місто зі списку ще раз.`);
        return;
      }

      // 2. Map Delivery Method
      let deliveryMethodDb = 'nova_poshta_dept';
      if (deliveryMethod === 'courier') deliveryMethodDb = 'nova_poshta_courier';
      if (deliveryMethod === 'self-pickup') deliveryMethodDb = 'self_pickup';

      // 3. Calculate total price with discount
      const calculatedTotalPrice = finalTotal;

      // Validate total price
      if (calculatedTotalPrice <= 0) {
        throw new Error('Некоректна сума замовлення. Будь ласка, перезавантажте сторінку та спробуйте ще раз.');
      }

      // 4. Prepare Payload (without items array since it's stored in a separate table)
      const orderData = {
        user_id: session?.user?.id || null,
        customer_name: `${data.firstName} ${data.lastName}`,
        customer_phone: data.phone,
        customer_email: data.email || '',
        delivery_method: deliveryMethodDb,
        delivery_info: {
          full_name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
          city: data.city,
          cityRef: finalCityRef,
          warehouse: data.warehouse || data.address || '',
          warehouseRef: finalWarehouseRef,
          comment: data.comment || '',
        },
        payment_method: paymentMethod === 'liqpay' ? 'liqpay' :
          paymentMethod === 'monobank-card' ? 'monobank_card' :
            paymentMethod === 'monobank-parts' ? 'monobank_parts' : 'cash',
        status: 'new',
        total_price: calculatedTotalPrice,
        promo_code: appliedCode?.code || null,
        discount_amount: discountAmount > 0 ? discountAmount : null,
      };

      // 5. Insert Order
      const orderResult: any = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderResult.error) throw orderResult.error;

      // 6. Insert Items (separately in order_items table)
      const orderItems = items.map(item => ({
        order_id: orderResult.data.id,
        product_id: Number(item.product.id),
        quantity: item.quantity,
        price_at_purchase: item.product.price,
        product_name: item.product.name
      }));

      const itemsResult: any = await supabase.from('order_items').insert(orderItems);
      if (itemsResult.error) throw itemsResult.error;

      // 7. Increment promo code usage if applied
      if (appliedCode) {
        await supabase
          .from('promo_codes')
          .update({ used_count: appliedCode.used_count + 1 })
          .eq('id', appliedCode.id);
      }

      // 8. Track purchase
      trackPurchase(
        orderResult.data.id.toString(),
        analyticsItems,
        calculatedTotalPrice,
        undefined, // tax
        undefined, // shipping
        appliedCode?.code || undefined  // coupon
      );



      // 9. Handle payment method
      if (paymentMethod === 'liqpay') {
        // For LiqPay, show redirect component instead of navigating to success page
        setLiqPayOrderData({
          orderId: orderResult.data.id.toString(),
          amount: calculatedTotalPrice,
          description: `Оплата замовлення #${orderResult.data.id}`
        });
        setShowLiqPay(true);
      } else if (paymentMethod === 'monobank-card' || paymentMethod === 'monobank-parts') {
        try {
          const actionName = paymentMethod === 'monobank-card' ? 'create' : 'create-part';

          // FIX: Send action INSIDE the body
          const payload = {
            action: actionName,
            amount: calculatedTotalPrice,
            orderId: orderResult.data.id,
            redirectUrl: `${window.location.origin}/payment/${orderResult.data.id}`,
            partsCount: paymentMethod === 'monobank-parts' ? (data.partsCount || 3) : undefined
          };

          // Invoke without custom headers
          const { data: monoData, error: monoError } = await supabase.functions.invoke('monopay', {
            body: payload
          });

          if (monoError) throw monoError;

          // Handle Monobank Parts payment (waiting for signature)
          if (paymentMethod === 'monobank-parts') {
            if (monoData?.status === 'pending_signature') {
              // Set waiting state and start polling
              setIsWaitingForSignature(true);
              setCurrentOrderId(orderResult.data.id);
              alert('Запит надіслано! Відкрийте додаток Monobank.');
              return; // Don't redirect, stay on page to show waiting UI
            } else {
              throw new Error('Invalid response from parts payment service');
            }
          }

          // Handle Monobank Card payment (redirect to payment page)
          if (paymentMethod === 'monobank-card') {
            if (!monoData?.pageUrl) throw new Error('Invalid response from payment service');
            window.location.href = monoData.pageUrl;
            return;
          }

        } catch (paymentError) {
          console.error('Monobank payment error:', paymentError);
          alert('Помилка створення платежу. Спробуйте ще раз.');
          // Don't navigate to success on error
        }
        return; // Stop execution here
      } else {
        // For cash on delivery and self-pickup (which uses cash logic), proceed to success
        setIsSuccess(true);

        // Navigate to success page which will handle clearing the cart
        navigate('/order-success', {
          state: {
            orderId: orderResult.data.id,
            totalAmount: calculatedTotalPrice,
            shouldClearCart: true
          }
        });
      }

    } catch (error: any) {
      console.error('❌ Checkout Error:', error);
      alert(`Виникла помилка з'єднання. Спробуйте ще раз`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If showing LiqPay redirect, render that component instead
  if (showLiqPay && liqPayOrderData) {
    return (
      <LiqPayRedirect
        orderId={liqPayOrderData.orderId}
        amount={liqPayOrderData.amount}
        description={liqPayOrderData.description}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF2E1]">
      <form onSubmit={handleSubmit(onSubmit, (errors) => console.error('❌ Помилки валідації:', errors))} className="container mx-auto px-4 md:px-8 max-w-[1440px] flex flex-col lg:flex-row gap-0">
        {/* Left Column - Form (60% width, White Background) */}
        <div className="w-full lg:w-[60%] bg-white p-6 md:p-8 lg:p-12">
          {/* Page Title */}
          <h1
            className="text-2xl md:text-3xl font-light mb-8 md:mb-12 text-center uppercase tracking-[2px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ОФОРМЛЕННЯ ЗАМОВЛЕННЯ
          </h1>

          <div className="space-y-8 md:space-y-12">
            {/* Section 1: КОНТАКТ */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-base md:text-lg font-medium uppercase tracking-[2px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Контакт
                </h2>
                {!session && (
                  <Link
                    to="/auth"
                    className="text-sm uppercase tracking-[1px] hover:underline text-gray-700"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Є акаунт? <span className="underline">Увійти</span>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <input
                    {...register('email')}
                    placeholder="Email*"
                    type="email"
                    className="w-full bg-transparent border-b border-gray-300 py-2 md:py-3 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 text-sm md:text-base"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs md:text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    {...register('firstName')}
                    placeholder="Ім'я*"
                    className="w-full bg-transparent border-b border-gray-300 py-2 md:py-3 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 text-sm md:text-base"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs md:text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    {...register('lastName')}
                    placeholder="Прізвище*"
                    className="w-full bg-transparent border-b border-gray-300 py-2 md:py-3 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 text-sm md:text-base"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs md:text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="Телефон*"
                    className="w-full bg-transparent border-b border-gray-300 py-2 md:py-3 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 text-sm md:text-base"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs md:text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: СПОСІБ ДОСТАВКИ */}
            <div>
              <h2
                className="text-base md:text-lg font-medium mb-4 md:mb-6 uppercase tracking-[2px]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Спосіб доставки
              </h2>

              {/* Delivery Options - Radio buttons */}
              <div className="space-y-3 mb-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    value="nova-poshta"
                    checked={deliveryMethod === 'nova-poshta'}
                    onChange={() => handleDeliveryMethodChange('nova-poshta')}
                    className="mt-1 mr-3 w-4 h-4 border-2 border-gray-300 text-black focus:ring-black"
                  />
                  <div className="flex-1">
                    <span
                      className="block uppercase tracking-[1px] font-medium text-sm md:text-base"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      У відділенні "Нова Пошта"
                    </span>
                    <p className="text-xs md:text-sm text-gray-600 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      до 3-х робочих днів
                    </p>
                    <p className="text-xs text-gray-500 italic mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      *доставка до поштоматів не здійснюється
                    </p>
                  </div>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    value="courier"
                    checked={deliveryMethod === 'courier'}
                    onChange={() => handleDeliveryMethodChange('courier')}
                    className="mt-1 mr-3 w-4 h-4 border-2 border-gray-300 text-black focus:ring-black"
                  />
                  <div className="flex-1">
                    <span
                      className="block uppercase tracking-[1px] font-medium text-sm md:text-base"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Кур'єром "Нова Пошта"
                    </span>
                  </div>
                </label>

                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    value="self-pickup"
                    checked={deliveryMethod === 'self-pickup'}
                    onChange={() => handleDeliveryMethodChange('self-pickup')}
                    className="mt-1 mr-3 w-4 h-4 border-2 border-gray-300 text-black focus:ring-black"
                  />
                  <div className="flex-1">
                    <span
                      className="block uppercase tracking-[1px] font-medium text-sm md:text-base"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Самовивіз
                    </span>
                    <p className="text-xs md:text-sm text-gray-600 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Безкоштовно
                    </p>
                  </div>
                </label>
              </div>

              {/* Self-Pickup Warning */}
              {deliveryMethod === 'self-pickup' && (
                <div className="bg-[#FAF4EB] border border-black p-4 mb-6">
                  <p className="text-sm font-medium mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Самовивіз за адресою: м. Київ, вулиця Січових стрільців, 14
                  </p>
                  <p className="text-sm italic text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Перед візитом, просимо Вас зателефонувати, щоб отримати актуальну інформацію перед отриманням.
                  </p>
                </div>
              )}

              {/* Dynamic Fields */}
              {(deliveryMethod === 'nova-poshta') ? (
                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <div className="border-b border-gray-300">
                      <AsyncSelect
                        placeholder="Місто*"
                        loadOptions={loadCities}
                        onChange={handleCityChange}
                        value={selectedCity}
                        isLoading={isLoadingCities}
                      />
                    </div>
                    {errors.city && (
                      <p className="text-red-500 text-xs md:text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="border-b border-gray-300">
                      <AsyncSelect
                        placeholder={selectedCity ? "Склад*" : "Спочатку оберіть місто"}
                        loadOptions={async (input) => {
                          if (!selectedCity?.ref) return [];

                          // For Nova Poshta, use existing logic
                          if (input.length < 2) return [];
                          return warehouses.filter(w => w.label.toLowerCase().includes(input.toLowerCase()));
                        }}
                        onChange={handleWarehouseChange}
                        value={selectedWarehouse}
                        isLoading={isLoadingWarehouses}
                        minInputLength={2}
                      />
                    </div>
                    {errors.warehouse && (
                      <p className="text-red-500 text-xs md:text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {errors.warehouse.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <textarea
                      {...register('comment')}
                      placeholder="Додаткова інформація"
                      rows={3}
                      className="w-full bg-transparent border-b border-gray-300 py-2 md:py-3 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 text-sm md:text-base resize-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                </div>
              ) : deliveryMethod === 'courier' ? (
                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <input
                      {...register('address')}
                      placeholder="Адреса доставки*"
                      className="w-full bg-transparent border-b border-gray-300 py-2 md:py-3 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 text-sm md:text-base"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <textarea
                      {...register('comment')}
                      placeholder="Додаткова інформація"
                      rows={3}
                      className="w-full bg-transparent border-b border-gray-300 py-2 md:py-3 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 text-sm md:text-base resize-none"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Section 3: ОПЛАТА */}
            <div>
              <h2
                className="text-base md:text-lg font-medium mb-4 md:mb-6 uppercase tracking-[2px]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Оплата
              </h2>

              <div className="space-y-3">
                {/* Cash on Delivery Option */}
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    value="cash-on-delivery"
                    checked={paymentMethod === 'cash-on-delivery'}
                    onChange={() => handlePaymentMethodChange('cash-on-delivery')}
                    className="mt-1 mr-3 w-4 h-4 border-2 border-gray-300 text-black focus:ring-black"
                  />
                  <span
                    className="block uppercase tracking-[1px] font-medium text-sm md:text-base"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Оплата під час отримання
                  </span>
                </label>

                {/* LiqPay Option */}
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    value="liqpay"
                    checked={paymentMethod === 'liqpay'}
                    onChange={() => handlePaymentMethodChange('liqpay')}
                    className="mt-1 mr-3 w-4 h-4 border-2 border-gray-300 text-black focus:ring-black"
                  />
                  <span
                    className="block uppercase tracking-[1px] font-medium text-sm md:text-base"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Оплата LiqPay
                  </span>
                </label>

                {/* Monobank Card Option */}
                <label className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    value="monobank-card"
                    checked={paymentMethod === 'monobank-card'}
                    onChange={() => handlePaymentMethodChange('monobank-card')}
                    className="mt-1 mr-3 w-4 h-4 border-2 border-gray-300 text-black focus:ring-black"
                  />
                  <span
                    className="block uppercase tracking-[1px] font-medium text-sm md:text-base"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Оплата карткою (Monobank)
                  </span>
                </label>

                {/* Monobank Parts Option */}
                <div>
                  <label className="flex items-start cursor-pointer mb-2">
                    <input
                      type="radio"
                      value="monobank-parts"
                      checked={paymentMethod === 'monobank-parts'}
                      onChange={() => handlePaymentMethodChange('monobank-parts')}
                      className="mt-1 mr-3 w-4 h-4 border-2 border-gray-300 text-black focus:ring-black"
                    />
                    <span
                      className="block uppercase tracking-[1px] font-medium text-sm md:text-base"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Купівля частинами (Monobank)
                    </span>
                  </label>

                  {/* Parts Count Selector - shown when parts payment is selected */}
                  {paymentMethod === 'monobank-parts' && (
                    <div className="ml-7 mb-2">
                      <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Кількість частин (3-24):
                      </label>
                      <select
                        value={partsCount}
                        onChange={(e) => {
                          const newPartsCount = parseInt(e.target.value);
                          setPartsCount(newPartsCount);
                          setValue('partsCount', newPartsCount);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map(num => (
                          <option key={num} value={num}>{num} частин</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary (40% width, Light Background) */}
        <div className="w-full lg:w-[40%] bg-[#FAF4EB] p-6 md:p-8 lg:p-12 border-t border-black lg:border-t-0 lg:border-l border-black flex flex-col">
          {/* Cart Items */}
          <div className="space-y-4 md:space-y-6 mb-6 md:mb-8 flex-1">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3 md:gap-4 items-start relative">
                {/* Product Image */}
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 flex-shrink-0">
                  <img
                    src={product.images[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-xs md:text-sm uppercase tracking-[0.5px] line-clamp-2 mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {product.name}
                  </p>
                  <p
                    className="text-gray-600 text-xs md:text-sm mb-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {quantity} X {product.price.toFixed(2)} ₴
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (quantity > 1) {
                          updateQuantity(product.id, quantity - 1);
                        } else {
                          removeItem(product.id);
                        }
                      }}
                      className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center border border-gray-300 hover:bg-gray-200 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span
                      className="text-sm md:text-base font-medium min-w-[20px] text-center"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center border border-gray-300 hover:bg-gray-200 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeItem(product.id)}
                  className="text-gray-400 hover:text-black transition-colors flex-shrink-0"
                >
                  <X size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <div className="mb-6">
            {appliedCode ? (
              <div className="border border-black bg-black p-3 md:p-4 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-white" />
                    <div>
                      <p
                        className="text-sm font-medium text-white uppercase"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Промокод застосовано: {appliedCode.code}
                      </p>
                      <p
                        className="text-xs text-white mt-1"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Знижка: {appliedCode.discount_type === 'percentage'
                          ? `${appliedCode.discount_value}%`
                          : `${appliedCode.discount_value.toFixed(2)} ₴`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCode}
                    className="text-white hover:opacity-70 transition-opacity"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  id="promo-code-input"
                  placeholder="ПРОМОКОД..."
                  className="w-full border-b border-gray-300 py-2 md:py-3 px-0 bg-transparent focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 text-sm md:text-base pr-24"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        applyCode(input.value.trim(), baseTotalPrice).then((success) => {
                          if (success) {
                            input.value = '';
                          }
                        });
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const input = document.getElementById('promo-code-input') as HTMLInputElement;
                    if (input?.value.trim()) {
                      const success = await applyCode(input.value.trim(), baseTotalPrice);
                      if (success) {
                        input.value = '';
                      }
                    }
                  }}
                  disabled={promoLoading}
                  className="absolute right-0 bottom-2 md:bottom-3 h-7 md:h-8 px-3 md:px-4 bg-black text-white hover:opacity-90 transition-opacity text-xs font-bold uppercase tracking-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {promoLoading ? '...' : 'ЗАСТОСУВАТИ'}
                </button>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="space-y-3 mb-6 md:mb-8">
            {/* Discount Badge */}
            {appliedCode && discountAmount > 0 && (
              <div className="mb-3 p-3 bg-black border border-black rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-white" />
                    <span
                      className="text-xs font-bold text-white uppercase tracking-[1px]"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Діє знижка
                    </span>
                    {appliedCode.discount_type === 'percentage' ? (
                      <span
                        className="text-xs font-bold text-white"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        -{appliedCode.discount_value}%
                      </span>
                    ) : (
                      <span
                        className="text-xs font-bold text-white"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        -{appliedCode.discount_value.toFixed(2)} ₴
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <span
                className="text-xs md:text-sm uppercase tracking-[1px] font-medium"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                ЗАГАЛЬНА СУМА:
              </span>
              <span
                className="text-xs md:text-sm uppercase tracking-[1px] font-medium"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {baseTotalPrice.toFixed(2)} ₴
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-black">
                <span
                  className="text-xs md:text-sm uppercase tracking-[1px] font-medium"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  ЗНИЖКА:
                </span>
                <span
                  className="text-xs md:text-sm uppercase tracking-[1px] font-medium font-bold"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  -{discountAmount.toFixed(2)} ₴
                </span>
              </div>
            )}

            {/* Shipping Cost */}
            <div className="flex justify-between">
              <span
                className="text-xs md:text-sm uppercase tracking-[1px] font-medium"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                ДОСТАВКА:
              </span>
              <span
                className={`text-xs md:text-sm uppercase tracking-[1px] font-medium ${shippingCost === 0 ? 'text-black font-bold' : ''
                  }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {deliveryMethod === 'self-pickup'
                  ? 'БЕЗКОШТОВНО'
                  : (
                    <span className="font-normal text-xs normal-case ml-2">(за тарифами перевізника)</span>
                  )
                }
              </span>
            </div>

            {/* Free Shipping Info */}
            {subtotal < FREE_SHIPPING_THRESHOLD && (
              <div className="bg-[#FAF4EB] border border-black rounded-lg p-3 mb-3">
                <p
                  className="text-xs text-black text-center"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Додайте товарів на {(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} ₴ для безкоштовної доставки (Нова Пошта)
                </p>
              </div>
            )}

            {subtotal >= FREE_SHIPPING_THRESHOLD && (
              <div className="bg-black border border-black rounded-lg p-3 mb-3">
                <p
                  className="text-xs text-white text-center font-medium uppercase"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  ✓ Безкоштовна доставка активована!
                </p>
              </div>
            )}

            {/* Warning for Nova Poshta about carrier rates */}
            {(deliveryMethod === 'nova-poshta' || deliveryMethod === 'courier') && (
              <p className="text-[10px] text-gray-500 text-right mt-[-8px] italic">
                Вартість доставки сплачується окремо при отриманні
              </p>
            )}

            <div className="flex justify-between pt-3 border-t border-gray-300">
              <span
                className="text-sm md:text-base font-light uppercase tracking-[1px]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                ЗАГАЛЬНА СУМА ЗАМОВЛЕННЯ:
              </span>
              <span
                className="text-sm md:text-base font-light uppercase tracking-[1px]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {finalTotal.toFixed(2)} ₴
              </span>
            </div>
          </div>

          {/* Legal Text */}
          <p
            className="text-xs text-gray-600 mb-4 md:mb-6 leading-relaxed"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Натиснувши на кнопку Оплатити, Ви погоджуєтесь з Політикою конфіденційності, Умовами обслуговування і Медичними рекомендаціями
          </p>

          {/* Waiting for Signature Message */}
          {isWaitingForSignature && (
            <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-center">
              <p
                className="text-yellow-800 font-medium"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Очікуємо підтвердження в додатку Monobank...
              </p>
              <p
                className="text-yellow-600 text-sm mt-1"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Відкрийте додаток Monobank та підтвердіть платіж
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isWaitingForSignature}
            className="w-full bg-black text-white py-3 md:py-4 text-sm md:text-base font-bold uppercase tracking-[2px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {isSubmitting && <Spinner size="sm" className="text-white" />}
            {isSubmitting ? 'Обробка...' : isWaitingForSignature ? 'ОЧІКУЄМО ПІДТВЕРДЖЕННЯ...' : 'ОФОРМИТИ'}
          </button>

          {/* Back Link */}
          <a
            href="/catalog"
            className="mt-4 text-sm uppercase tracking-[1px] hover:underline text-center md:text-left"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            &lt; Назад до покупок
          </a>
        </div>
      </form>
    </div>
  );
}