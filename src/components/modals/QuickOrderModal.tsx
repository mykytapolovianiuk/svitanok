import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Spinner from '../ui/Spinner';
import { sendOrderNotification } from '../../services/notifications';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string | number;
    name: string;
    price: number;
    attributes?: any; // For completeOrderData
  };
}

export default function QuickOrderModal({ isOpen, onClose, product }: QuickOrderModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Ensure phone starts with +380
  useEffect(() => {
    if (!phone.startsWith('+380')) {
      setPhone('+380');
    }
  }, [phone]);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setName('');
      setPhone('+380');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || phone.length < 12) {
      toast.error('Будь ласка, заповніть всі поля коректно');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Order
      const orderData = {
        status: 'new',
        delivery_method: 'quick_order',
        payment_method: 'cash',
        total_price: product.price,
        customer_name: name,
        customer_phone: phone,
      };

      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItemData = {
        order_id: orderResult.id,
        product_id: Number(product.id),
        quantity: 1,
        price_at_purchase: product.price,
        product_name: product.name
      };

      const { error: itemError } = await supabase
        .from('order_items')
        .insert(orderItemData);

      if (itemError) throw itemError;

      // 3. Send Telegram Notification
      try {
        const completeOrderData = {
          ...orderResult,
          ...orderData,
          order_items: [{
            ...orderItemData,
            products: {
              name: product.name,
              price: product.price,
              attributes: product.attributes || {}
            }
          }]
        };
        await sendOrderNotification(orderResult.id, completeOrderData);
      } catch (tgError) {
        console.error('Failed to send Telegram notification:', tgError);
        // Continue even if Telegram fails
      }

      // 4. Show Success UI
      setIsSuccess(true);

      // Clear form
      setName('');
      setPhone('+380');
    } catch (error) {
      console.error('Quick order error:', error);
      toast.error('Помилка при оформленні замовлення. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-none border border-black shadow-xl">
        {/* Header (hidden in success state, or just keep X button) */}
        {!isSuccess && (
          <div className="flex items-center justify-between p-6 border-b border-black">
            <h2
              className="text-xl font-medium uppercase tracking-[2px]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Швидке замовлення
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {isSuccess ? (
          // SUCCESS UI
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="text-green-600 w-10 h-10" />
            </div>

            <h2
              className="text-2xl font-bold mb-4 uppercase tracking-[1px] text-gray-900"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Дякуємо за замовлення!
            </h2>

            <p className="text-gray-600 mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Ваше замовлення успішно прийнято. Наш менеджер зв'яжеться з вами найближчим часом для підтвердження деталей.
            </p>

            <button
              onClick={onClose}
              className="w-full bg-black text-white py-4 text-sm font-bold uppercase tracking-[2px] hover:opacity-90 transition-all"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Закрити
            </button>
          </div>
        ) : (
          // FORM UI
          <>
            {/* Product Info */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3
                className="font-medium text-base mb-2 uppercase tracking-wide"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {product.name}
              </h3>
              <p
                className="text-lg font-semibold"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {product.price.toFixed(2)} ₴
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="quick-order-name"
                    className="block text-sm font-medium mb-2 uppercase tracking-[1px]"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Ім'я *
                  </label>
                  <input
                    type="text"
                    id="quick-order-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-300 py-2 px-0 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    placeholder="Ваше ім'я"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="quick-order-phone"
                    className="block text-sm font-medium mb-2 uppercase tracking-[1px]"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    id="quick-order-phone"
                    value={phone}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Ensure it starts with +380
                      if (!value.startsWith('+380')) {
                        value = '+380' + value.replace(/\D/g, '').substring(3);
                      }
                      setPhone(value);
                    }}
                    className="w-full bg-transparent border-b border-gray-300 py-2 px-0 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    placeholder="+380XXXXXXXXX"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-8 bg-black text-white py-4 text-sm font-bold uppercase tracking-[2px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {isSubmitting && <Spinner size="sm" className="text-white" />}
                {isSubmitting ? 'Обробка...' : 'Чекаю дзвінка'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}