import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function DiscountBanner() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  
  if (isAuthenticated) {
    return null;
  }

  return (
    <section className="relative w-full py-12 md:py-16 lg:py-20 overflow-hidden">
      {}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/images/discount/discount-bg.jpg)',
          opacity: 0.5,
        }}
      />

      {}
      <div className="relative z-10 container mx-auto px-4 md:px-8 max-w-[1440px] text-center">
        <h2
          className="font-bold mb-4 md:mb-6 px-2"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '20px',
            lineHeight: '1.2',
            color: '#000000',
            letterSpacing: '0.5px',
          }}
        >
          <span className="md:text-2xl lg:text-3xl xl:text-4xl">
            ЗАРЕЄСТРУЙТЕСЯ ТА ОТРИМАЙТЕ 10% ЗНИЖКУ
          </span>
        </h2>

        <p
          className="mb-6 md:mb-8 max-w-3xl mx-auto px-2"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#000000',
          }}
        >
          <span className="md:text-base lg:text-lg xl:text-xl">
            Створіть акаунт та отримайте промокод на знижку для вашого першого замовлення
          </span>
        </p>

        <Link
          to="/auth"
          className="inline-block px-6 md:px-8 lg:px-10 py-2.5 md:py-3 lg:py-4 font-semibold transition-all hover:opacity-90"
          style={{
            backgroundColor: '#000000',
            color: '#FFFFFF',
            borderRadius: '5px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '12px',
            letterSpacing: '0.5px',
          }}
        >
          <span className="md:text-sm lg:text-base">Зареєструватися зараз</span>
        </Link>
      </div>
    </section>
  );
}