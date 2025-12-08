import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '../features/auth/useUserStore';
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Star, 
  AlertCircle,
  ArrowRight,
  Calendar,
  Truck,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { StatsCardSkeleton, TableSkeleton } from '../components/ui/SkeletonLoader';

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    lastMonth: number;
  };
  products: {
    total: number;
    inStock: number;
    outOfStock: number;
  };
  recentOrders: any[];
  topProducts: any[];
}

export default function Admin() {
  const refreshProfile = useUserStore((state) => state.refreshProfile);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    orders: {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
    revenue: {
      total: 0,
      today: 0,
      thisMonth: 0,
      lastMonth: 0,
    },
    products: {
      total: 0,
      inStock: 0,
      outOfStock: 0,
    },
    recentOrders: [],
    topProducts: [],
  });

  useEffect(() => {
    refreshProfile();
    fetchDashboardData();
  }, [refreshProfile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // Fetch order items for top products
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, product:products(*)')
        .limit(100);

      if (itemsError) throw itemsError;

      // Calculate order stats
      const orders = ordersData || [];
      const orderStats = {
        total: orders.length,
        pending: orders.filter((o: any) => o.status === 'pending').length,
        processing: orders.filter((o: any) => o.status === 'processing').length,
        shipped: orders.filter((o: any) => o.status === 'shipped').length,
        delivered: orders.filter((o: any) => o.status === 'delivered').length,
        cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
      };

      // Calculate revenue
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const deliveredOrders = orders.filter((o: any) => o.status === 'delivered');
      const revenue = {
        total: deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0),
        today: deliveredOrders
          .filter((o: any) => new Date(o.created_at) >= today)
          .reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0),
        thisMonth: deliveredOrders
          .filter((o: any) => new Date(o.created_at) >= thisMonth)
          .reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0),
        lastMonth: deliveredOrders
          .filter((o: any) => {
            const orderDate = new Date(o.created_at);
            return orderDate >= lastMonth && orderDate <= lastMonthEnd;
          })
          .reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0),
      };

      // Calculate product stats
      const products = productsData || [];
      const productStats = {
        total: products.length,
        inStock: products.filter((p: any) => p.in_stock).length,
        outOfStock: products.filter((p: any) => !p.in_stock).length,
      };

      // Get recent orders (last 5)
      const recentOrders = orders.slice(0, 5);

      // Calculate top products
      const productCounts: Record<string, { count: number; revenue: number; product: any }> = {};
      (itemsData || []).forEach((item: any) => {
        const productId = item.product_id;
        if (!productCounts[productId]) {
          productCounts[productId] = {
            count: 0,
            revenue: 0,
            product: item.product,
          };
        }
        productCounts[productId].count += item.quantity;
        productCounts[productId].revenue += item.price_at_purchase * item.quantity;
      });

      const topProducts = Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        orders: orderStats,
        revenue,
        products: productStats,
        recentOrders,
        topProducts,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenueChange = stats.revenue.lastMonth > 0
    ? ((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Панель управління
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Огляд статистики та ключових показників
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Загальний дохід</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.revenue.total.toLocaleString('uk-UA')} ₴
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Сьогодні</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.revenue.today.toLocaleString('uk-UA')} ₴
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Цей місяць</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.revenue.thisMonth.toLocaleString('uk-UA')} ₴
              </p>
              {stats.revenue.lastMonth > 0 && (
                <p className={`text-xs mt-1 ${parseFloat(revenueChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(revenueChange) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(revenueChange))}% від минулого місяця
                </p>
              )}
            </div>
            <Calendar className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Всього замовлень</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.orders.total}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Orders & Products Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Status */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Статуси замовлень
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Нові
                </span>
              </div>
              <span className="text-lg font-bold text-blue-600">{stats.orders.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  В обробці
                </span>
              </div>
              <span className="text-lg font-bold text-yellow-600">{stats.orders.processing}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Відправлено
                </span>
              </div>
              <span className="text-lg font-bold text-purple-600">{stats.orders.shipped}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Доставлено
                </span>
              </div>
              <span className="text-lg font-bold text-green-600">{stats.orders.delivered}</span>
            </div>
            {stats.orders.cancelled > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Скасовано
                  </span>
                </div>
                <span className="text-lg font-bold text-red-600">{stats.orders.cancelled}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Products Status */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Статус товарів
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Всього товарів
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats.products.total}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  В наявності
                </span>
              </div>
              <span className="text-lg font-bold text-green-600">{stats.products.inStock}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Немає в наявності
                </span>
              </div>
              <span className="text-lg font-bold text-red-600">{stats.products.outOfStock}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Останні замовлення
            </h2>
            <Link
              to="/admin/orders"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              Всі замовлення
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Немає замовлень</p>
            ) : (
              stats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      #{String(order.id).substring(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {Number(order.total_price || 0).toLocaleString('uk-UA')} ₴
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status === 'pending' ? 'Нове' :
                       order.status === 'processing' ? 'Обробляється' :
                       order.status === 'shipped' ? 'Відправлено' :
                       order.status === 'delivered' ? 'Доставлено' :
                       'Скасовано'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Топ товарів
            </h2>
            <Link
              to="/admin/products"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              Всі товари
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Немає даних</p>
            ) : (
              stats.topProducts.map((item: any, index: number) => (
                <div key={item.product?.id || index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {item.product?.name || 'Товар'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Продано: {item.count} шт.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {item.revenue.toFixed(2)} ₴
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Швидкі дії
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/orders"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <ShoppingBag className="h-6 w-6 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Замовлення
              </p>
              <p className="text-xs text-gray-500">Управління замовленнями</p>
            </div>
          </Link>
          <Link
            to="/admin/products"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Package className="h-6 w-6 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Товари
              </p>
              <p className="text-xs text-gray-500">Управління товарами</p>
            </div>
          </Link>
          <Link
            to="/admin/reviews"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Star className="h-6 w-6 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Відгуки
              </p>
              <p className="text-xs text-gray-500">Модерація відгуків</p>
            </div>
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Users className="h-6 w-6 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Налаштування
              </p>
              <p className="text-xs text-gray-500">Налаштування сайту</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
