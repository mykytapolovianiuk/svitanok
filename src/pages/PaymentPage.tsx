import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Order {
  id: number;
  status: string;
  payment_status: string;
  payment_type: string | null;
  monobank_data: Record<string, any> | null;
  total_price: number;
}

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);

  // Poll for payment status
  useEffect(() => {
    if (!order || order.payment_status === 'paid' || order.payment_status === 'failed') {
      return;
    }
    
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('payment_status, status')
          .eq('id', orderId)
          .single();
        
        if (error) throw error;
        
        setOrder(prev => prev ? { ...prev, ...data } : null);
        
        // Stop polling when payment is complete
        if (data.payment_status === 'paid' || data.payment_status === 'failed') {
          clearInterval(interval);
          setPolling(false);
          
          // Navigate to success page after successful payment
          if (data.payment_status === 'paid') {
            setTimeout(() => {
              navigate('/order-success', { state: { orderId: orderId } });
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [order, orderId, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p style={{ fontFamily: 'Montserrat, sans-serif' }}>Завантаження...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Замовлення не знайдено
        </h1>
        <Link
          to="/"
          className="px-6 py-3 bg-black text-white rounded hover:opacity-90 transition"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Повернутися на головну
        </Link>
      </div>
    );
  }

  // Render based on payment status
  if (order.payment_status === 'paid') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Оплата успішна!
        </h1>
        <p className="text-gray-600 mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Ваше замовлення #{order.id} успішно оплачено.
        </p>
        <p className="text-gray-600 mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Перенаправлення на сторінку підтвердження...
        </p>
      </div>
    );
  }

  if (order.payment_status === 'failed') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Оплата не вдалася
        </h1>
        <p className="text-gray-600 mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Сталася помилка під час оплати замовлення #{order.id}.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={`/checkout`}
            className="px-6 py-3 bg-black text-white rounded hover:opacity-90 transition text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Спробувати ще раз
          </Link>
          <Link
            to="/"
            className="px-6 py-3 border border-black text-black rounded hover:bg-gray-100 transition text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Повернутися на головну
          </Link>
        </div>
      </div>
    );
  }

  // Payment pending state
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-blue-500" />
        </div>

        <h1
          className="text-3xl font-bold mb-4"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Очікуємо оплату
        </h1>

        <p
          className="text-gray-600 mb-8"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Замовлення №{orderId}
        </p>

        <div className="bg-gray-50 rounded-lg p-8 mb-8">
          <h2
            className="font-semibold mb-4"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {order.payment_type === 'monobank_parts' ? 'Купівля частинами' : 'Оплата карткою'}
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
            <p className="text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {polling 
                ? 'Очікуємо підтвердження оплати...' 
                : 'Перенаправлення на сторінку оплати...'
              }
            </p>
            {polling && (
              <div className="mt-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
              </div>
            )}
          </div>
          
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Сторінка автоматично оновиться після завершення оплати
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-black text-white rounded hover:opacity-90 transition text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Оновити статус
          </button>
          <Link
            to="/"
            className="px-6 py-3 border border-black text-black rounded hover:bg-gray-100 transition text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Повернутися на головну
          </Link>
        </div>
      </div>
    </div>
  );
}
