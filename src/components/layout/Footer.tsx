import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Footer() {
  const phone = useSiteSetting('phone', '+380 99 378 60 36');
  const instagramUrl = useSiteSetting('instagram_url', 'https://www.instagram.com/pava.beauty.ua/');
  const address = useSiteSetting('address', 'м. Київ');
  const email = useSiteSetting('email', 'svitanok@gmail.com');
  const [categories, setCategories] = useState<{name: string}[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name');
      
      if (!error && data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  return (
    <footer className="mt-16 font-sans" style={{ backgroundColor: 'rgba(255, 200, 140, 0.7)' }}>
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {}
          <div className="col-span-2 md:col-span-1">
            <h3 
              className="text-lg md:text-xl font-bold text-text-main mb-3 md:mb-4 tracking-wider"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              SVITANOK
            </h3>
            <div className="flex gap-3 md:gap-4 mt-3 md:mt-4">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-main hover:opacity-70 transition"
                aria-label="Instagram"
              >
                <Instagram size={20} className="md:w-6 md:h-6" />
              </a>
            </div>
          </div>

          {}
          <div className="col-span-1">
            <h4 
              className="font-semibold text-text-main mb-3 md:mb-4 text-sm md:text-base"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Категорії
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link 
                    to={`/catalog?category=${encodeURIComponent(category.name)}`} 
                    className="text-text-main hover:opacity-70 transition"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {}
          <div className="col-span-1">
            <h4 
              className="font-semibold text-text-main mb-3 md:mb-4 text-sm md:text-base"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Допомога
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link 
                  to="/delivery" 
                  className="text-text-main hover:opacity-70 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Доставка
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-text-main hover:opacity-70 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Питання та відповіді
                </Link>
              </li>
              <li>
                <Link 
                  to="/returns" 
                  className="text-text-main hover:opacity-70 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Обмін та повернення
                </Link>
              </li>
            </ul>
          </div>

          {}
          <div className="col-span-2 md:col-span-1">
            <h4 
              className="font-semibold text-text-main mb-3 md:mb-4 text-sm md:text-base"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Контакти
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-text-main" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <li>{address}</li>
              <li>
                <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="hover:underline">
                  {phone}
                </a>
              </li>
              <li>{email}</li>
            </ul>
          </div>
        </div>

        {}
        <div className="border-t border-gray-400 mt-6 md:mt-8 pt-4 md:pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-xs md:text-sm text-text-main">
            <p style={{ fontFamily: 'Montserrat, sans-serif' }}>
              © 2025 SVITANOK. Всі права захищені.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 lg:gap-6">
              <Link 
                to="/privacy" 
                className="hover:underline"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Політика конфіденційності
              </Link>
              <Link 
                to="/terms" 
                className="hover:underline"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Умови використання
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}