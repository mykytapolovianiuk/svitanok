import { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { supabase } from '../lib/supabase';
import { ga4 } from '../lib/analytics/ga4';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCartStore();

  // Extract variables primarily from location.state, OR from URL query params
  const stateOrderId = location.state?.orderId || location.state?.order?.id;
  const urlOrderId = searchParams.get('orderId') || searchParams.get('order_id');
  const orderId = stateOrderId || urlOrderId;

  const orderData = location.state?.order || null;
  const [order, setOrder] = useState<any>(orderData);
  const [items, setItems] = useState<any[]>(
    location.state?.items || orderData?.order_items || []
  );
  const [totalAmount, setTotalAmount] = useState<number>(
    location.state?.totalAmount || orderData?.total_price || orderData?.total || 0
  );

  // Strict Mode Safe Ref Flag to prevent double execution
  const isPurchaseTracked = useRef<boolean>(false);

  // 1. Clear cart if requested
  useEffect(() => {
    if (location.state?.shouldClearCart) {
      clearCart();
    }
  }, [location.state?.shouldClearCart, clearCart]);

  // 2. Fetch order & items from API if missing in state
  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    const fetchOrderData = async () => {
      try {
        let currentOrder = order;
        // Fetch order details
        if (!currentOrder) {
          const { data: fetchedOrder, error: orderErr } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          if (orderErr) throw orderErr;
          currentOrder = fetchedOrder;
          setOrder(fetchedOrder);
          if (!totalAmount) setTotalAmount(fetchedOrder.total_price || fetchedOrder.total);
        }

        // Fetch order items if necessary
        if (items.length === 0) {
          const { data: fetchedItems, error: itemsErr } = await supabase
            .from('order_items')
            .select('*, product:products(*)')
            .eq('order_id', orderId);

          if (itemsErr) throw itemsErr;
          setItems(fetchedItems || []);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Error fetching order for tracking:', err);
        }
      }
    };

    if (!order || items.length === 0) {
      fetchOrderData();
    }
  }, [orderId, order, items.length, totalAmount, navigate]);

  // 3. Track GA4 Purchase (Exactly 1 Time)
  useEffect(() => {
    // Only fire if we have order and items, AND we haven't tracked yet
    if (isPurchaseTracked.current) return;
    if (!order || !items || items.length === 0) return;

    if (typeof window !== 'undefined') {
      ga4.purchase({ order, items });
      isPurchaseTracked.current = true; // Block future executions
    }
  }, [order, items]);

  if (!orderId) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>

        <h1
          className="text-3xl font-bold mb-4"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Дякуємо за замовлення!
        </h1>

        <p
          className="text-gray-600 mb-2"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Ваше замовлення №{orderId} успішно оформлено.
        </p>

        {totalAmount > 0 && (
          <p
            className="text-gray-600 mb-8"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Сума до оплати: {totalAmount.toFixed(2)} ₴
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-black text-white rounded hover:opacity-90 transition text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Повернутися на головну
          </Link>
          <Link
            to="/catalog"
            className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-50 transition text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Продовжити покупки
          </Link>
        </div>
      </div>
    </div>
  );
}