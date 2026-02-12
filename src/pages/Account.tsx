import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '../features/auth/useUserStore';
import type { Order, OrderItem, Product, Profile } from '../types';
import ProfileForm from '../components/auth/ProfileForm';
import { formatDateTime, formatPrice } from '../utils/helpers';
import { OrderListSkeleton } from '../components/ui/SkeletonLoader';
import {
  User,
  Package,
  LogOut,
  Settings,
  ShoppingBag,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Truck,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderWithItems extends Order {
  items: (OrderItem & { product: Product })[];
}

export default function Account() {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [profile, setProfile] = useState<Profile>({
    id: '',
    role: 'user',
    full_name: null,
    phone: null,
    address: null,
    created_at: '',
    updated_at: ''
  });
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useUserStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Ви вийшли з акаунту');
      navigate('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Помилка виходу: ' + error.message);
    }
  };

  useEffect(() => {
    if (session) {
      fetchProfile();
      fetchOrders();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map((order: any) => order.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            product:products(*)
          `)
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        const ordersWithItems = ordersData.map((order: any) => ({
          ...order,
          items: itemsData?.filter((item: any) => item.order_id === order.id) || []
        })) as OrderWithItems[];

        setOrders(ordersWithItems);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Не вдалося завантажити замовлення');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    toast.success('Профіль оновлено');
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Нове';
      case 'processing': return 'В обробці';
      case 'shipped': return 'Відправлено';
      case 'delivered': return 'Доставлено';
      case 'cancelled': return 'Скасовано';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDeliveryMethodText = (method: string | null) => {
    switch (method) {
      case 'nova_poshta_dept': return 'Нова Пошта (відділення)';
      case 'nova_poshta_courier': return 'Нова Пошта (кур\'єр)';
      case 'ukrposhta': return 'Укрпошта';
      case 'quick_order': return 'Швидке замовлення';
      default: return method || '—';
    }
  };

  const stats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 lg:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <h1
            className="text-3xl md:text-4xl font-light text-gray-900 mb-2 uppercase tracking-[2px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Особистий кабінет
          </h1>
          <p
            className="text-gray-500 font-light text-lg"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Вітаємо, {profile.full_name || session?.user?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation - Left Column */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <nav className="space-y-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 gap-2 lg:gap-0">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full text-left ${activeTab === 'profile'
                      ? 'bg-black text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <User className="h-5 w-5" />
                  Особисті дані
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full text-left ${activeTab === 'orders'
                      ? 'bg-black text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Package className="h-5 w-5" />
                  Мої замовлення
                  {orders.length > 0 && (
                    <span className={`ml-auto text-xs py-0.5 px-2 rounded-full ${activeTab === 'orders' ? 'bg-white text-black' : 'bg-gray-200 text-gray-600'}`}>
                      {orders.length}
                    </span>
                  )}
                </button>

                {session?.profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors whitespace-nowrap"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    Адмін-панель
                  </Link>
                )}

                <div className="pt-2 lg:mt-2 lg:border-t lg:border-gray-100">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Вийти
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content - Right Column */}
          <div className="lg:col-span-9">
            {activeTab === 'profile' ? (
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                  <div>
                    <h2
                      className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wide flex items-center gap-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <User className="h-5 w-5" />
                      Редагування профілю
                    </h2>
                    <ProfileForm
                      profile={profile}
                      onUpdate={handleProfileUpdate}
                    />
                  </div>

                  <div className="space-y-8">
                    {/* Account Stats */}
                    <div>
                      <h2
                        className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wide flex items-center gap-2"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <ShoppingBag className="h-5 w-5" />
                        Статистика
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Всього замовлень</p>
                          <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Витрачено</p>
                          <p className="text-2xl font-semibold text-gray-900">{formatPrice(stats.totalSpent)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Info */}
                    <div>
                      <h2
                        className="text-xl font-medium text-gray-900 mb-6 uppercase tracking-wide flex items-center gap-2"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <Settings className="h-5 w-5" />
                        Інформація акаунту
                      </h2>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="p-2 bg-white rounded-full shadow-sm">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{session?.user?.email}</p>
                          </div>
                        </div>

                        {session?.user?.phone && (
                          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="p-2 bg-white rounded-full shadow-sm">
                              <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Телефон (логін)</p>
                              <p className="text-sm font-medium text-gray-900 mt-0.5">{session.user.phone}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="p-2 bg-white rounded-full shadow-sm">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Дата реєстрації</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">
                              {profile.created_at ? formatDateTime(profile.created_at, false) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Orders View */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2
                    className="text-xl font-medium text-gray-900 uppercase tracking-wide"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Історія замовлень
                  </h2>
                </div>

                {loading ? (
                  <OrderListSkeleton count={3} />
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShoppingBag className="h-10 w-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">У вас ще немає замовлень</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                      Почніть шопінг прямо зараз та насолоджуйтесь нашими кращими товарами.
                    </p>
                    <Link
                      to="/catalog"
                      className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Перейти до каталогу
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div
                          className="p-6 cursor-pointer"
                          onClick={() => toggleOrderExpansion(order.id)}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <Package className="h-6 w-6 text-gray-800" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-semibold text-gray-900">
                                    Замовлення #{String(order.id).slice(0, 8).toUpperCase()}
                                  </h3>
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    {getStatusText(order.status)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDateTime(order.created_at, true)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ShoppingBag className="h-4 w-4" />
                                    {order.items.length} товарів
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 ml-14 md:ml-0">
                              <p className="text-xl font-bold text-gray-900">
                                {formatPrice(Number(order.total_price))}
                              </p>
                              <div className={`transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-180' : ''}`}>
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedOrderId === order.id && (
                          <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              <div className="lg:col-span-2 space-y-4">
                                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                  <ShoppingBag className="h-4 w-4" />
                                  Товари
                                </h4>
                                <div className="space-y-3">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 bg-white p-3 rounded-lg border border-gray-100">
                                      <Link to={`/product/${item.product?.slug}`}>
                                        <img
                                          src={item.product?.images?.[0] || '/placeholder-product.jpg'}
                                          alt={item.product?.name}
                                          className="w-16 h-16 object-cover rounded-md border border-gray-100"
                                        />
                                      </Link>
                                      <div className="flex-1 min-w-0">
                                        <Link
                                          to={`/product/${item.product?.slug}`}
                                          className="text-sm font-medium text-gray-900 truncate block hover:text-black hover:underline"
                                        >
                                          {item.product?.name}
                                        </Link>
                                        <div className="flex justify-between items-end mt-2">
                                          <p className="text-xs text-gray-500">
                                            {item.quantity} шт × {formatPrice(item.price_at_purchase)}
                                          </p>
                                          <p className="text-sm font-medium text-gray-900">
                                            {formatPrice(item.quantity * item.price_at_purchase)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-6">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    Доставка
                                  </h4>
                                  <div className="bg-white p-4 rounded-lg border border-gray-100 text-sm space-y-3">
                                    <div>
                                      <span className="text-gray-500 block text-xs uppercase mb-1">Спосіб доставки</span>
                                      <span className="font-medium">{getDeliveryMethodText(order.delivery_method)}</span>
                                    </div>

                                    {(order.delivery_info as any)?.city && (
                                      <div>
                                        <span className="text-gray-500 block text-xs uppercase mb-1">Адреса</span>
                                        <span className="font-medium">
                                          {(order.delivery_info as any).city}
                                          {(order.delivery_info as any)?.warehouse && `, ${(order.delivery_info as any).warehouse}`}
                                        </span>
                                      </div>
                                    )}

                                    {order.ttn && (
                                      <div className="pt-2 border-t border-gray-100 mt-2">
                                        <span className="text-gray-500 block text-xs uppercase mb-1">ТТН</span>
                                        <a
                                          href={`https://novaposhta.ua/tracking/?cargo_number=${order.ttn}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          {order.ttn}
                                          <ChevronRight className="h-3 w-3" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Отримувач
                                  </h4>
                                  <div className="bg-white p-4 rounded-lg border border-gray-100 text-sm">
                                    <p className="font-medium mb-1">{(order.delivery_info as any)?.full_name || 'Не вказано'}</p>
                                    <p className="text-gray-500">{(order.delivery_info as any)?.phone || 'Не вказано'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}