import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { useSiteSetting } from '@/hooks/useSiteSettings';

export default function Footer() {
  const phone = useSiteSetting('phone', '+380 99 378 60 36');
  const instagramUrl = useSiteSetting('instagram_url', 'https://www.instagram.com/pava.beauty.ua/');
  const address = useSiteSetting('address', 'м. Київ, вулиця Січових стрільців, 14');
  const email = useSiteSetting('email', 'svitanok@gmail.com');

  return (
    <footer className="text-black mt-16 border-t border-gray-200" style={{ backgroundColor: 'rgba(255, 200, 140, 0.7)' }}>
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Column 1: Logo & Contact */}
          <div className="space-y-4">
            <h3
              className="text-xl font-bold tracking-wider"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              SVITANOK
            </h3>
            <div className="space-y-2 text-sm">
              <p>{address}</p>
              <p>
                <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="hover:text-gray-600 transition">
                  {phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${email}`} className="hover:text-gray-600 transition">
                  {email}
                </a>
              </p>
            </div>
            <div className="flex gap-4 pt-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-600 transition"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>


          {/* Column 2: Information */}
          <div className="space-y-4">
            <h4
              className="font-semibold text-lg"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Інформація
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/about"
                  className="hover:text-gray-600 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Про нас
                </Link>
              </li>
              <li>
                <Link
                  to="/delivery"
                  className="hover:text-gray-600 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Доставка та оплата
                </Link>
              </li>
              <li>
                <Link
                  to="/returns"
                  className="hover:text-gray-600 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Обмін та повернення
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-gray-600 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Політика конфіденційності
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Client */}
          <div className="space-y-4">
            <h4
              className="font-semibold text-lg"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Клієнтам
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/account"
                  className="hover:text-gray-600 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Мій акаунт
                </Link>
              </li>
              <li>
                <Link
                  to="/favorites"
                  className="hover:text-gray-600 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Обране
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="hover:text-gray-600 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Часті питання
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p style={{ fontFamily: 'Montserrat, sans-serif' }}>
              © 2025 SVITANOK. Всі права захищені.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                to="/privacy"
                className="hover:text-gray-800 transition"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Політика конфіденційності
              </Link>
              <Link
                to="/terms"
                className="hover:text-gray-800 transition"
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