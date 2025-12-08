import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';
import { useSiteSetting } from '@/hooks/useSiteSettings';

export default function Footer() {
  const phone = useSiteSetting('phone', '+380 99 378 60 36');
  const instagramUrl = useSiteSetting('instagram_url', 'https://www.instagram.com/pava.beauty.ua/');
  const address = useSiteSetting('address', 'м. Київ');
  const email = useSiteSetting('email', 'svitanok@gmail.com');

  return (
    <footer className="mt-16 font-sans" style={{ backgroundColor: 'rgba(255, 200, 140, 0.7)' }}>
      <div className="container mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Column 1: Brand & Social */}
          <div className="col-span-2 md:col-span-1">
            <h3 
              className="text-lg md:text-xl font-bold text-text-main mb-3 md:mb-4 tracking-wider"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              SVITANOK
            </h3>
            <div className="flex gap-3 md:gap-4 mt-3 md:mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-main hover:opacity-70 transition"
                aria-label="Facebook"
              >
                <Facebook size={20} className="md:w-6 md:h-6" />
              </a>
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

          {/* Column 2: Товари */}
          <div className="col-span-1">
            <h4 
              className="font-semibold text-text-main mb-3 md:mb-4 text-sm md:text-base"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Товари
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link 
                  to="/catalog?category=Inner Care" 
                  className="text-text-main hover:opacity-70 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Inner Care
                </Link>
              </li>
              <li>
                <Link 
                  to="/catalog?category=Skin Care" 
                  className="text-text-main hover:opacity-70 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Skin Care
                </Link>
              </li>
              <li>
                <Link 
                  to="/catalog?category=Scalp Care" 
                  className="text-text-main hover:opacity-70 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Scalp Care
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Допомога */}
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
                  to="/news" 
                  className="text-text-main hover:opacity-70 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  News
                </Link>
              </li>
              <li>
                <Link 
                  to="/vision" 
                  className="text-text-main hover:opacity-70 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Vision
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-text-main hover:opacity-70 transition"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Q&A
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Контакти */}
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
                <a href="tel:+380993786036" className="hover:underline">
                  {phone}
                </a>
              </li>
              <li>{email}</li>
            </ul>
          </div>
        </div>

        {/* Copyright & Policies */}
        <div className="border-t border-gray-400 mt-6 md:mt-8 pt-4 md:pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-xs md:text-sm text-text-main">
            <p style={{ fontFamily: 'Montserrat, sans-serif' }}>
              CEIN. 2019 KINS All rights reserved
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