import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Package, ShoppingBag, Star, Users, Settings, LayoutDashboard, ChevronRight, Ticket, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Панель управління', href: '/admin', icon: LayoutDashboard },
    { name: 'Замовлення', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Товари', href: '/admin/products', icon: Package },
    { name: 'Хіти продажу', href: '/admin/bestsellers', icon: TrendingUp },
    { name: 'Промокоди', href: '/admin/promocodes', icon: Ticket },
    { name: 'Відгуки', href: '/admin/reviews', icon: Star },
    { name: 'Клієнти', href: '/admin/customers', icon: Users },
    { name: 'Налаштування', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      
      toast.success('Вихід з адмінки');
      navigate('/account');
    } catch (error: any) {
      toast.error('Помилка виходу: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-hidden">
      {}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-gray-900" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4 border-b border-gray-200 pb-4">
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  SVITANOK
                </h1>
                <span className="ml-2 text-xs text-gray-500 uppercase tracking-wider">Admin</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive(item.href)
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors`}
                      onClick={() => setSidebarOpen(false)}
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-white' : 'text-gray-400'}`} />
                      {item.name}
                      {isActive(item.href) && (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 px-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Вийти з адмінки
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 pb-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              SVITANOK
            </h1>
            <span className="ml-2 text-xs text-gray-500 uppercase tracking-wider">Admin</span>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors`}
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-white' : 'text-gray-400'}`} />
                    {item.name}
                    {isActive(item.href) && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="px-2 pb-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Вийти з адмінки
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="md:pl-64 flex flex-col flex-1 h-screen overflow-y-auto">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-2 py-3">
            <button
              type="button"
              className="h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Відкрити меню</span>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              SVITANOK Admin
            </h1>
            <div className="w-10" /> {}
          </div>
        </div>
        <main className="flex-1 bg-gray-100">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}