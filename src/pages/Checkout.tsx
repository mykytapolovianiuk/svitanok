import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useCartStore, useCartTotalPrice } from '@/store/cartStore';
import { useUserStore } from '@/features/auth/useUserStore';
import { useAnalytics, formatCartItemsForAnalytics } from '@/hooks/useAnalytics';
import { usePromoCode } from '@/hooks/usePromoCode';
import AsyncSelect from '@/components/ui/AsyncSelect';
import { searchSettlements, getWarehouses, CityOption, WarehouseOption } from '@/services/novaPoshta';
import { searchCities as searchUkrposhtaCities, getWarehouses as getUkrposhtaWarehouses } from '@/services/ukrPoshta';
import LiqPayRedirect from '@/components/checkout/LiqPayRedirect';
import { sendOrderNotification } from '@/services/notifications';
import { X, Plus, Minus, Check, Tag } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

// Schema Validation
const checkoutSchema = z.object({
  firstName: z.string().min(1, "Введіть ім'я"),
  lastName: z.string().min(1, 'Введіть прізвище'),
  phone: z.string().min(12, 'Введіть коректний номер телефону').startsWith('380', { message: 'Номер телефону має починатися з 380' }),
  email: z.string().email('Невірний формат email').or(z.literal('')),
  deliveryMethod: z.enum(['nova-poshta', 'courier', 'ukrposhta']),
  city: z.string().min(1, 'Оберіть місто'),
  cityRef: z.string().optional(),
  warehouse: z.string().optional(),
  warehouseRef: z.string().optional(),
  address: z.string().optional(),
  paymentMethod: z.enum(['cash-on-delivery', 'liqpay']),
  comment: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

/**
 * Форма оформлення замовлення
 * Обробляє введення даних користувача, доставку та оплату
 */
export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart, removeItem, updateQuantity } = useCartStore();
  const baseTotalPrice = useCartTotalPrice();
  const { session } = useUserStore();
  const { trackBeginCheckout, trackAddPaymentInfo, trackAddShippingInfo, trackPurchase } = useAnalytics();
  const { appliedCode, isLoading: promoLoading, applyCode, removeCode } = usePromoCode();
  
  // Константа для безкоштовної доставки
  const FREE_SHIPPING_THRESHOLD = 4000;
  const SHIPPING_COST = 150; // Вартість доставки, якщо не досягнуто порогу

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
  const shippingCost = useMemo(() => {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  }, [subtotal]);

  const finalTotal = useMemo(() => {
    return subtotal + shippingCost;
  }, [subtotal, shippingCost]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [showLiqPay, setShowLiqPay] = useState(false);
  const [liqPayOrderData, setLiqPayOrderData] = useState<{ orderId: string; amount: number; description: string } | null>(null);
  
  // State to store full objects
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseOption | null>(null);
  
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);

  // Empty Cart Check
  useEffect(() => {
    if (items.length === 0) navigate('/catalog');
  }, [items, navigate]);

          // Track begin checkout on mount
          const analyticsItems = useMemo(() => formatCartItemsForAnalytics(items), [items]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: () => {
      // Load draft data from localStorage on component mount
      const draftData = localStorage.getItem('checkout_draft');
      if (draftData) {
        try {
          const parsedData = JSON.parse(draftData);
          return parsedData;
        } catch (e) {
          console.error('Failed to parse checkout draft data:', e);
          localStorage.removeItem('checkout_draft'); // Clear corrupted data
        }
      }
      // Default values if no draft data
      return {
        deliveryMethod: 'nova-poshta',
        paymentMethod: 'cash-on-delivery',
      };
    },
  });

  // Save form data to localStorage on every change
  useEffect(() => {
    const subscription = watch((data) => {
      // Save to localStorage whenever form data changes
      localStorage.setItem('checkout_draft', JSON.stringify(data));
    });
    
    return () => subscription.unsubscribe();
  }, [watch]);

  // Clear localStorage draft on successful order submission
  const clearCheckoutDraft = () => {
    localStorage.removeItem('checkout_draft');
  };

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
        
        // If it's empty, just update
        if (digitsOnly === '') {
          setValue('phone', '', { shouldValidate: true });
          return;
        }
        
        // If it starts with 0, remove the 0 and prepend 380
        if (digitsOnly.startsWith('0')) {
          const formattedPhone = '380' + digitsOnly.substring(1);
          // Only update if the value has changed to prevent infinite loop
          if (formattedPhone !== phoneValue) {
            setValue('phone', formattedPhone, { shouldValidate: true });
          }
        }
        // If it doesn't start with 380, prepend 380
        else if (!digitsOnly.startsWith('380')) {
          const formattedPhone = '380' + digitsOnly;
          // Only update if the value has changed to prevent infinite loop
          if (formattedPhone !== phoneValue) {
            setValue('phone', formattedPhone, { shouldValidate: true });
          }
        }
        // If it already starts with 380, ensure it's properly formatted
        else if (digitsOnly.startsWith('380')) {
          // Only update if the value has changed to prevent infinite loop
          if (digitsOnly !== phoneValue) {
            setValue('phone', digitsOnly, { shouldValidate: true });
          }
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
                            'ukrposhta';
      trackAddShippingInfo(analyticsItems, finalTotal, shippingTier);
    }
  }, [deliveryMethod, analyticsItems, finalTotal, items.length]);

  // Load Cities
  const loadCities = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2) return [];
    setIsLoadingCities(true);
    try {
      if (deliveryMethod === 'ukrposhta') {
        return await searchUkrposhtaCities(inputValue);
      }
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
          
          if (deliveryMethod === 'ukrposhta') {
            results = await getUkrposhtaWarehouses(selectedCity.ref!);
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
  const handleDeliveryMethodChange = (method: 'nova-poshta' | 'courier' | 'ukrposhta') => {
    setValue('deliveryMethod', method);
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method: 'cash-on-delivery' | 'liqpay') => {
    setValue('paymentMethod', method);
  };

  // Обробка замовлення: валідація -> база -> ТТН
  const onSubmit = async (data: CheckoutFormData) => {
    if (!session) return;
    setIsSubmitting(true);

    try {
      // 1. CRITICAL VALIDATION FOR NOVA POSHTA
      const finalCityRef = data.cityRef || selectedCity?.ref || '';
      const finalWarehouseRef = data.warehouseRef || selectedWarehouse?.ref || '';

      if (deliveryMethod === 'nova-poshta' && !finalCityRef) {
        alert('Помилка: Не вдалося визначити код міста для Нової Пошти. Спробуйте обрати місто зі списку ще раз.');
        return;
      }

      // 2. Map Delivery Method
      let deliveryMethodDb = 'nova_poshta_dept';
      if (deliveryMethod === 'courier') deliveryMethodDb = 'nova_poshta_courier';
      if (deliveryMethod === 'ukrposhta') deliveryMethodDb = 'ukrposhta';

      // 3. Calculate total price with discount
      const calculatedTotalPrice = finalTotal;

      // Validate total price
      if (calculatedTotalPrice <= 0) {
        throw new Error('Некоректна сума замовлення. Будь ласка, перезавантажте сторінку та спробуйте ще раз.');
      }

      // 4. Prepare Payload (without items array since it's stored in a separate table)
      const orderData = {
        user_id: session.user.id,
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
        payment_method: paymentMethod === 'liqpay' ? 'liqpay' : 'cash',
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

      // 8. Send Telegram notification (before redirecting)
      try {
        // Include items in the notification data
        const notificationData = {
          ...orderData,
          id: orderResult.data.id,
          items: orderItems
        };
        await sendOrderNotification(orderResult.data.id, notificationData);
      } catch (notificationError) {
        console.error('Failed to send Telegram notification:', notificationError);
        // Continue with the flow even if notification fails
      }

      // 8.1. Send order confirmation email
      if (orderData.customer_email) {
        try {
          const { sendOrderConfirmation } = await import('../services/email');
          await sendOrderConfirmation({
            orderId: orderResult.data.id.toString(),
            customerName: orderData.customer_name || 'Користувач',
            customerEmail: orderData.customer_email,
            items: items.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price * item.quantity,
            })),
            totalPrice: calculatedTotalPrice,
            deliveryMethod: deliveryMethod || '',
            deliveryInfo: orderData.delivery_info || undefined,
            paymentMethod: paymentMethod === 'liqpay' ? 'Онлайн оплата' : 'Накладений платіж',
            orderDate: new Date().toISOString(),
          });
        } catch (emailError) {
          console.error('Failed to send order confirmation email:', emailError);
          // Continue even if email fails
        }
      }

      // 9. Handle payment method
      if (paymentMethod === 'liqpay') {
        // For LiqPay, show redirect component instead of navigating to success page
        setLiqPayOrderData({
          orderId: orderResult.data.id.toString(),
          amount: calculatedTotalPrice,
          description: `Оплата замовлення #${orderResult.data.id}`
        });
        setShowLiqPay(true);
        // Clear checkout draft from localStorage on successful order submission
        clearCheckoutDraft();
      } else {
        // For cash on delivery, proceed as before
        clearCart();
        navigate('/order-success', { state: { orderId: orderResult.data.id } });
        // Clear checkout draft from localStorage on successful order submission
        clearCheckoutDraft();
      }

    } catch (error: any) {
      console.error('Checkout Error:', error);
      alert('Виникла помилка з\'єднання. Спробуйте ще раз');
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
      <form onSubmit={handleSubmit(onSubmit)} className="container mx-auto px-4 md:px-8 max-w-[1440px] flex flex-col lg:flex-row gap-0">
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
                    placeholder="Ім'я"
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
            </div>

            {/* Dynamic Fields */}
            {(deliveryMethod === 'nova-poshta' || deliveryMethod === 'ukrposhta') ? (
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
                        if (!input) return warehouses;
                        return warehouses.filter(w => w.label.toLowerCase().includes(input.toLowerCase()));
                      }}
                      onChange={handleWarehouseChange}
                      value={selectedWarehouse}
                      isLoading={isLoadingWarehouses}
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
            ) : (
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
            )}
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
              className={`text-xs md:text-sm uppercase tracking-[1px] font-medium ${
                shippingCost === 0 ? 'text-black font-bold' : ''
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {shippingCost === 0 ? 'БЕЗКОШТОВНО' : `${shippingCost.toFixed(2)} ₴`}
            </span>
          </div>

          {/* Free Shipping Info */}
          {subtotal < FREE_SHIPPING_THRESHOLD && (
            <div className="bg-[#FAF4EB] border border-black rounded-lg p-3 mb-3">
              <p 
                className="text-xs text-black text-center"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Додайте товарів на {(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} ₴ для безкоштовної доставки
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-3 md:py-4 text-sm md:text-base font-bold uppercase tracking-[2px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {isSubmitting && <Spinner size="sm" className="text-white" />}
            {isSubmitting ? 'Обробка...' : 'ОФОРМИТИ'}
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