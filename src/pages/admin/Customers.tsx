import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Profile } from '../../types';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Filter,
  Download,
  ExternalLink
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { exportCustomersToCSV } from '../../utils/exportToCSV';
import toast from 'react-hot-toast';
import { TableSkeleton } from '../../components/ui/SkeletonLoader';

interface CustomerWithStats extends Profile {
  orders_count?: number;
  total_spent?: number;
  last_order_date?: string;
  email?: string;
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'with_orders' | 'no_orders'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, activeFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total_price, created_at, status, customer_email')
        .in('status', ['delivered', 'shipped']);

      if (ordersError) throw ordersError;

      
      const customerEmails: Record<string, string> = {};
      orders?.forEach(order => {
        if (order.customer_email && order.user_id) {
          customerEmails[order.user_id] = order.customer_email;
        }
      });
      
      
      const customersWithStats: CustomerWithStats[] = (profiles || []).map((profile) => {
        const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
        
        const ordersCount = userOrders.length;
        const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
        const lastOrder = userOrders.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          ...profile,
          orders_count: ordersCount,
          total_spent: totalSpent,
          last_order_date: lastOrder?.created_at || null,
          email: customerEmails[profile.id] || undefined,
        };
      });

      setCustomers(customersWithStats);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Не вдалося завантажити клієнтів');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => {
        const name = customer.full_name?.toLowerCase() || '';
        const email = customer.email?.toLowerCase() || '';
        const phone = customer.phone?.toLowerCase() || '';
        return name.includes(term) || email.includes(term) || phone.includes(term);
      });
    }

    
    if (activeFilter === 'with_orders') {
      filtered = filtered.filter(c => (c.orders_count || 0) > 0);
    } else if (activeFilter === 'no_orders') {
      filtered = filtered.filter(c => (c.orders_count || 0) === 0);
    }

    setFilteredCustomers(filtered);
  };

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      setLoadingOrders(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setCustomerOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching customer orders:', error);
      toast.error('Не вдалося завантажити замовлення');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCustomerClick = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    fetchCustomerOrders(customer.id);
  };

  const getStatusBadge = (customer: CustomerWithStats) => {
    if ((customer.orders_count || 0) > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <UserCheck className="w-3 h-3 mr-1" />
          Активний
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
        <UserX className="w-3 h-3 mr-1" />
        Новий
      </span>
    );
  };

  if (loading) {
    return <TableSkeleton rows={10} columns={6} />;
  }

  const stats = {
    total: customers.length,
    active: customers.filter(c => (c.orders_count || 0) > 0).length,
    new: customers.filter(c => (c.orders_count || 0) === 0).length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Клієнти
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Управління базою клієнтів
          </p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Всього клієнтів</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Активні</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Нові</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.new}</p>
            </div>
            <UserX className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Загальний дохід</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRevenue.toLocaleString('uk-UA')} ₴</p>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Пошук за ім'ям, email або телефоном..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
          
          {}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex gap-2">
              {['all', 'with_orders', 'no_orders'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeFilter === filter
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {filter === 'all' ? 'Всі' : 
                   filter === 'with_orders' ? 'З замовленнями' :
                   'Без замовлень'}
                </button>
              ))}
            </div>
          </div>

          {}
          <button
            onClick={() => {
              try {
                exportCustomersToCSV(filteredCustomers);
                toast.success('Клієнтів експортовано в CSV');
              } catch (error) {
                console.error('Error exporting customers:', error);
                toast.error('Помилка експорту клієнтів');
              }
            }}
            disabled={filteredCustomers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <Download size={18} />
            <span className="text-sm font-medium">Експорт CSV</span>
          </button>
        </div>
      </div>

      {}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клієнт
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Контакти
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Замовлення
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Витрачено
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleCustomerClick(customer)}>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {customer.full_name || 'Без імені'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Реєстрація: {formatDate(customer.created_at)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm text-gray-900 space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{customer.phone}</span>
                        </div>
                      )}
                      {!customer.email && !customer.phone && (
                        <span className="text-xs text-gray-400">Немає контактів</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{customer.orders_count || 0}</span>
                    </div>
                    {customer.last_order_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        Останнє: {formatDate(customer.last_order_date)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {(customer.total_spent || 0).toLocaleString('uk-UA')} ₴
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(customer)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCustomerClick(customer);
                      }}
                      className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Деталі"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Клієнти не знайдені
            </p>
          </div>
        )}
      </div>

      {}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Деталі клієнта: {selectedCustomer.full_name || 'Без імені'}
              </h3>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerOrders([]);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Закрити</span>
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Контактна інформація
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Статистика
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Замовлень:</span>
                      <span className="font-medium">{selectedCustomer.orders_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Витрачено:</span>
                      <span className="font-medium">{(selectedCustomer.total_spent || 0).toLocaleString('uk-UA')} ₴</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Реєстрація:</span>
                      <span className="font-medium">{formatDate(selectedCustomer.created_at)}</span>
                    </div>
                    {selectedCustomer.last_order_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Останнє замовлення:</span>
                        <span className="font-medium">{formatDate(selectedCustomer.last_order_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Історія замовлень
                </h4>
                {loadingOrders ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Немає замовлень</p>
                ) : (
                  <div className="space-y-3">
                    {customerOrders.map((order: any) => (
                      <div 
                        key={order.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => {
                          navigate(`/admin/orders?orderId=${order.id}`);
                          setSelectedCustomer(null);
                          setCustomerOrders([]);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                #{String(order.id).substring(0, 8)}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {order.status === 'delivered' ? 'Доставлено' :
                                 order.status === 'shipped' ? 'Відправлено' :
                                 order.status === 'processing' ? 'В обробці' :
                                 'Нове'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              {formatDate(order.created_at)}
                            </div>
                            <div className="text-sm text-gray-700">
                              Товарів: {order.order_items?.length || 0}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div className="text-lg font-bold text-gray-900">
                              {Number(order.total_price || 0).toLocaleString('uk-UA')} ₴
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

