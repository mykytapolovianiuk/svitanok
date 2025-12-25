import { useEffect, useRef } from 'react';

interface LiqPayRedirectProps {
  orderId: string;
  amount: number;
  description: string;
}

export default function LiqPayRedirect({ orderId, amount, description }: LiqPayRedirectProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    
    const initiatePayment = async () => {
      try {
        
        const requestData = {
          orderId: orderId.toString(), 
          amount,
          currency: 'UAH',
          description,
        };
        
        
        
        
        const response = await fetch('/api/liqpay-sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(result.error);
        }

        const { data, signature } = result;

        
        const form = formRef.current;
        if (form) {
          
          const dataInput = document.createElement('input');
          dataInput.type = 'hidden';
          dataInput.name = 'data';
          dataInput.value = data;
          form.appendChild(dataInput);

          
          const signatureInput = document.createElement('input');
          signatureInput.type = 'hidden';
          signatureInput.name = 'signature';
          signatureInput.value = signature;
          form.appendChild(signatureInput);

          
          form.submit();
        }
      } catch (error) {
        
        alert('Виникла помилка при ініціалізації оплати. Спробуйте ще раз.');
      }
    };

    
    initiatePayment();
  }, [orderId, amount, description]);

  return (
    <div className="min-h-screen bg-[#FFF2E1] py-8 flex items-center justify-center">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        <div className="bg-white p-8 rounded-sm border border-black max-w-md mx-auto text-center">
          <h2 
            className="text-2xl font-medium mb-4 uppercase tracking-widest"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Перенаправлення на оплату
          </h2>
          <p 
            className="mb-6 text-gray-600"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Ви будете автоматично перенаправлені на сторінку оплати LiqPay...
          </p>
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
          <p 
            className="text-sm text-gray-500"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Якщо перенаправлення не відбулося автоматично, натисніть кнопку нижче
          </p>
          <form
            ref={formRef}
            method="POST"
            action="https://www.liqpay.ua/api/3/checkout"
            acceptCharset="utf-8"
            className="mt-4"
          >
            <button
              type="submit"
              className="w-full bg-black text-white py-3 uppercase tracking-widest hover:opacity-90"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Оплатити зараз
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}