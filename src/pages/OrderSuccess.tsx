import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { sendOrderNotification } from '../services/notifications';
import { supabase } from '../lib/supabase';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, totalAmount } = location.state || {};
  const { trackPurchase } = useAnalytics();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [notificationSent, setNotificationSent] = useState(false);

  // If no order data, redirect to home
  useEffect(() => {
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  // Fetch order details for notification and analytics
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items(
              *,
              products(
                name,
                price,
                attributes
              )
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) {
          console.error('Error fetching order details:', error);
          return;
        }

        setOrderDetails(data);
      } catch (error) {
        console.error('Error fetching order details:', error);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Send Telegram notification
  useEffect(() => {
    const sendNotification = async () => {
      if (orderDetails && !notificationSent) {
        // ... existing notification logic ...
        try {
          const result = await sendOrderNotification(
            orderDetails.id,
            {
              customer_name: orderDetails.customer_name,
              customer_phone: orderDetails.customer_phone,
              customer_email: orderDetails.customer_email,
              delivery_method: orderDetails.delivery_method,
              delivery_info: orderDetails.delivery_info,
              total_price: orderDetails.total_price,
              items: orderDetails.order_items || []
            }
          );

          if (result.success) {
            setNotificationSent(true);
            console.log('Telegram notification sent successfully');
          } else {
            console.error('Failed to send Telegram notification:', result.error);
          }
        } catch (error) {
          console.error('Error sending Telegram notification:', error);
        }
      }
    };

    sendNotification();
  }, [orderDetails, notificationSent]);

  // Track purchase event (GA4)
  useEffect(() => {
    if (!orderDetails || !window.gtag) return;

    const storageKey = `ga4_purchase_sent_${orderDetails.id}`;
    if (localStorage.getItem(storageKey)) {
      console.log('Purchase event already sent for order:', orderDetails.id);
      return;
    }

    const items = orderDetails.order_items?.map((item: any) => ({
      item_id: item.product_id?.toString() || "",
      item_name: item.products?.name || "",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      item_category: item.products?.attributes?.Category || "",
      item_brand: "", // Required as empty string if missing
      discount: 0,
      currency: "UAH"
    })) || [];

    // Send to specific GA4 stream as requested
    window.gtag('event', 'purchase', {
      send_to: "G-KMSCH1JTVB",
      transaction_id: orderDetails.id?.toString() || "",
      value: Number(orderDetails.total_price) || 0,
      currency: "UAH",
      tax: 0,
      shipping: 0, // Assuming shipping is included or 0 if not separate
      items: items
    });

    // Mark as sent
    localStorage.setItem(storageKey, 'true');
    console.log('GA4 Purchase event sent for order:', orderDetails.id);

    // Also track with standard hook for other analytics (optional, keeping for consistency if needed, 
    // but the requirement specifically asked for the above custom implementation)
    // We can keep the hook usage but maybe without the specific send_to validation if it's general purpose.
    // However, since we did a manual implementation above to satisfy specific requirements, 
    // we might skip calling trackPurchase from the hook to avoid double counting if the hook doesn't support the exact same payload.
    // The requirement said "use window.gtag", so the direct call above is correct.

  }, [orderDetails]);

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

        <p
          className="text-gray-600 mb-8"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Сума до оплати: {totalAmount?.toFixed(2)} ₴
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h2
            className="font-semibold mb-3"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Що далі?
          </h2>
          <ul
            className="space-y-2 text-sm text-gray-600"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <li>• Ми зв'яжемося з вами для підтвердження замовлення</li>
            <li>• Очікуйте SMS з інформацією про доставку</li>
            <li>• Оплату можна здійснити при отриманні</li>
          </ul>
        </div>

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