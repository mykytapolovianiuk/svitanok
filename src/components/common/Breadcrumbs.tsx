

import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Головна', path: '/' },
  ];

  
  let currentPath = '';
  pathnames.forEach((pathname, index) => {
    currentPath += `/${pathname}`;
    
    
    if (pathname === 'admin') return;
    
    
    let label = pathname;
    
    
    if (pathname === 'catalog') {
      label = 'Каталог';
    } else if (pathname === 'product') {
      
      return;
    } else if (pathname === 'about') {
      label = 'Про нас';
    } else if (pathname === 'contacts') {
      label = 'Контакти';
    } else if (pathname === 'delivery') {
      label = 'Доставка';
    } else if (pathname === 'faq') {
      label = 'FAQ';
    } else if (pathname === 'cart') {
      label = 'Кошик';
    } else if (pathname === 'checkout') {
      label = 'Оформлення замовлення';
    } else if (pathname === 'account') {
      label = 'Особистий кабінет';
    } else if (pathname === 'favorites') {
      label = 'Обране';
    } else {
      
      if (currentPath.includes('/product/') && index === pathnames.length - 1) {
        try {
          
          label = decodeURIComponent(pathname);
        } catch (e) {
          
          label = pathname;
        }
      } else {
        
        label = pathname.charAt(0).toUpperCase() + pathname.slice(1);
      }
    }
    
    breadcrumbs.push({ label, path: currentPath });
  });

  
  if (pathnames.length === 0) {
    return null;
  }

  return (
    <nav className="container mx-auto px-4 py-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={crumb.path} className="flex items-center">
              {index > 0 && (
                <ChevronRight size={16} className="mx-2 text-gray-400" />
              )}
              {isLast ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}