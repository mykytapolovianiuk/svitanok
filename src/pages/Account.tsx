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
  XCircle
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
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
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

  // REMOVE any internal useEffect that calls Maps('/auth') or checks for !session
  // The ProtectedRoute wrapper already handles security.
  // HANDLE NULL PROFILE: If profile is null but user exists, do NOT redirect.
  // Instead, render the <ProfileForm /> so the user can fill in their details.

  return (
    <div className="min-h-screen bg-[#FFF2E1] py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-2 uppercase tracking-[2px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Мій акаунт
          </h1>
          <p
            className="text-gray-600 text-sm md:text-base"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Управління профілем та замовленнями
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-none border border-black p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs md:text-sm text-gray-600 uppercase tracking-[1px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Всього замовлень
                </p>
                <p
                  className="text-2xl md:text-3xl font-medium text-gray-900 mt-2"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {stats.totalOrders}
                </p>
              </div>
              <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-none border border-black p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs md:text-sm text-gray-600 uppercase tracking-[1px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Витрачено
                </p>
                <p
                  className="text-2xl md:text-3xl font-medium text-gray-900 mt-2"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {formatPrice(stats.totalSpent)}
                </p>
              </div>
              <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-none border border-black p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs md:text-sm text-gray-600 uppercase tracking-[1px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Очікують
                </p>
                <p
                  className="text-2xl md:text-3xl font-medium text-yellow-600 mt-2"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {stats.pendingOrders}
                </p>
              </div>
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-none border border-black mb-6">
          <div className="border-b border-black">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors uppercase tracking-[1px] ${activeTab === 'profile'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <div className="flex items-center justify-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Профіль</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors uppercase tracking-[1px] ${activeTab === 'orders'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Замовлення ({orders.length})</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {activeTab === 'profile' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Profile Section */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  <div>
                    <h2
                      className="text-lg md:text-xl font-medium text-gray-900 mb-4 md:mb-6 uppercase tracking-[1px]"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Особиста інформація
                    </h2>
                    {/* Pass the user.phone (from the store) as a default value to the ProfileForm */}
                    <ProfileForm
                      profile={profile}
                      onUpdate={handleProfileUpdate}
                    />
                  </div>

                  {/* Account Info */}
                  <div className="border-t border-black pt-6 md:pt-8">
                    <h3
                      className="text-base md:text-lg font-medium text-gray-900 mb-4 md:mb-6 uppercase tracking-[1px]"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Інформація про акаунт
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
                        <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p
                            className="text-xs text-gray-600 uppercase tracking-[1px]"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            Email
                          </p>
                          <p
                            className="text-sm md:text-base font-medium text-gray-900 mt-1"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            {session?.user?.email}
                          </p>
                        </div>
                      </div>
                      {/* Display phone from auth session if available */}
                      {session?.user?.phone && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
                          <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div>
                            <p
                              className="text-xs text-gray-600 uppercase tracking-[1px]"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              Телефон
                            </p>
                            <p
                              className="text-sm md:text-base font-medium text-gray-900 mt-1"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              {session.user.phone}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
                        <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p
                            className="text-xs text-gray-600 uppercase tracking-[1px]"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            Дата реєстрації
                          </p>
                          <p
                            className="text-sm md:text-base font-medium text-gray-900 mt-1"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            {profile.created_at ? formatDateTime(profile.created_at, false) : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="lg:col-span-1">
                  <div className="bg-[#FAF4EB] rounded-none border border-black p-6">
                    <h3
                      className="text-base md:text-lg font-medium text-gray-900 mb-4 md:mb-6 uppercase tracking-[1px]"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Дії
                    </h3>
                    <div className="space-y-3">
                      {session?.profile?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors uppercase tracking-[1px]"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          <Settings className="h-4 w-4" />
                          Адмін панель
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-red-600 text-sm font-medium text-red-600 bg-white hover:bg-red-600 hover:text-white transition-colors uppercase tracking-[1px]"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <LogOut className="h-4 w-4" />
                        Вийти з акаунту
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Orders Section */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="text-lg md:text-xl font-medium text-gray-900 uppercase tracking-[1px]"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Історія замовлень
                  </h2>
                </div>

                {loading ? (
                  <OrderListSkeleton count={5} />
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 md:py-16">
                    <Package className="h-16 w-16 md:h-20 md:w-20 text-gray-400 mx-auto mb-4" />
                    <p
                      className="text-gray-600 mb-4 text-sm md:text-base"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      У вас ще немає замовлень
                    </p>
                    <Link
                      to="/catalog"
                      className="inline-flex items-center px-6 py-3 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors uppercase tracking-[1px]"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Перейти до каталогу
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    {orders.map((order) => (
                      <div key={order.id.toString()} className="border border-black rounded-none overflow-hidden bg-white">
                        {/* Order Summary */}
                        <div
                          className="p-4 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleOrderExpansion(order.id)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <Package className="h-5 w-5 text-gray-400" />
                                <h3
                                  className="font-medium text-gray-900 uppercase tracking-wide"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                >
                                  Замовлення #{String(order.id).substring(0, 8).toUpperCase()}
                                </h3>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-xs font-medium border uppercase tracking-wide ${getStatusClass(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDateTime(order.created_at, true)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ShoppingBag className="h-4 w-4" />
                                  <span>{order.items.length} товарів</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p
                                  className="text-lg md:text-xl font-medium text-gray-900"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                >
                                  {formatPrice(Number(order.total_price || 0))}
                                </p>
                              </div>
                              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                {expandedOrderId === order.id ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Order Details */}
                        {expandedOrderId === order.id && (
                          <div className="border-t border-black bg-[#FAF4EB] p-4 md:p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Order Items */}
                              <div className="lg:col-span-2">
                                <h4
                                  className="text-sm md:text-base font-medium text-gray-900 mb-4 uppercase tracking-[1px]"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                >
                                  Товари в замовленні
                                </h4>
                                <div className="space-y-3">
                                  {order.items.map((item) => {
                                    const product = item.product as any;
                                    return (
                                      <div key={item.id} className="flex items-start gap-3 bg-white p-3 md:p-4 border border-black">
                                        <img
                                          src={product?.images?.[0] || '/placeholder-product.jpg'}
                                          alt={product?.name || 'Товар'}
                                          className="w-16 h-16 md:w-20 md:h-20 object-cover flex-shrink-0 border border-black"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <Link
                                            to={`/product/${encodeURIComponent(product?.slug || '')}`}
                                            className="text-sm md:text-base font-medium text-gray-900 hover:text-gray-700 transition-colors block truncate uppercase tracking-wide"
                                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                                          >
                                            {product?.name || 'Товар'}
                                          </Link>
                                          <p
                                            className="text-xs md:text-sm text-gray-500 mt-1"
                                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                                          >
                                            Кількість: {item.quantity} × {formatPrice(item.price_at_purchase)}
                                          </p>
                                        </div>
                                        <p
                                          className="text-sm md:text-base font-medium text-gray-900 whitespace-nowrap"
                                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                                        >
                                          {formatPrice(item.price_at_purchase * item.quantity)}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="mt-4 pt-4 border-t border-black">
                                  <div className="flex justify-between items-center">
                                    <p
                                      className="text-sm md:text-base font-medium text-gray-900 uppercase tracking-[1px]"
                                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                                    >
                                      Загальна сума:
                                    </p>
                                    <p
                                      className="text-lg md:text-xl font-medium text-gray-900"
                                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                                    >
                                      {formatPrice(Number(order.total_price || 0))}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Delivery Info */}
                              <div>
                                <h4
                                  className="text-sm md:text-base font-medium text-gray-900 mb-4 uppercase tracking-[1px]"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                >
                                  Інформація про доставку
                                </h4>
                                <div className="space-y-3 text-sm bg-white p-4 border border-black">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Truck className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium text-gray-700">Тип доставки:</span>
                                    </div>
                                    <p className="text-gray-900 ml-6">{getDeliveryMethodText(order.delivery_method)}</p>
                                  </div>
                                  {(order.delivery_info as any)?.full_name && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-700">Отримувач:</span>
                                      </div>
                                      <p className="text-gray-900 ml-6">{(order.delivery_info as any).full_name}</p>
                                    </div>
                                  )}
                                  {(order.delivery_info as any)?.phone && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-700">Телефон:</span>
                                      </div>
                                      <p className="text-gray-900 ml-6">{(order.delivery_info as any).phone}</p>
                                    </div>
                                  )}
                                  {(order.delivery_info as any)?.city && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-700">Адреса:</span>
                                      </div>
                                      <p className="text-gray-900 ml-6">
                                        {(order.delivery_info as any).city}
                                        {(order.delivery_info as any)?.warehouse && `, ${(order.delivery_info as any).warehouse}`}
                                      </p>
                                    </div>
                                  )}
                                  {order.ttn && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Package className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-700">ТТН:</span>
                                      </div>
                                      <a
                                        href={`https://novaposhta.ua/tracking/?cargo_number=${order.ttn}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm break-all block ml-6"
                                      >
                                        {order.ttn}
                                      </a>
                                    </div>
                                  )}
                                  {(order.delivery_info as any)?.comment && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <span className="font-medium text-gray-700">Коментар:</span>
                                      <p className="text-gray-900 mt-1">{(order.delivery_info as any).comment}</p>
                                    </div>
                                  )}
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