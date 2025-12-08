import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();

  // In a real implementation, this would integrate with LiqPay API
  // For now, it's a placeholder

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            ></path>
          </svg>
        </div>

        <h1
          className="text-3xl font-bold mb-4"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Оплата замовлення
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
            Оплата карткою через LiqPay
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
            <p className="text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Тут буде форма оплати LiqPay
            </p>
          </div>
          
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Після успішної оплати ви будете перенаправлені на сторінку підтвердження
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-black text-white rounded hover:opacity-90 transition text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Повернутися на головну
          </Link>
        </div>
      </div>
    </div>
  );
}
