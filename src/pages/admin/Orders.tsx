import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { OrderWithItems } from '../../types';
import { FileText, Package, User, Calendar, DollarSign, Truck, ChevronDown, ChevronUp, Search, Filter, Download } from 'lucide-react';
import { createTTN } from '../../services/novaPoshtaAdmin';
import { formatDate } from '../../utils/helpers';
import { exportOrdersToCSV } from '../../utils/exportToCSV';
import toast from 'react-hot-toast';
import { OrderListSkeleton } from '../../components/ui/SkeletonLoader';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedOrderId = searchParams.get('orderId');
  const orderRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, activeFilter, searchTerm]);

  // Handle highlighting order from URL
  useEffect(() => {
    if (highlightedOrderId && orders.length > 0) {
      // Find the order
      const order = orders.find(o => o.id === highlightedOrderId);
      if (order) {
        // Expand the order
        setExpandedOrderId(highlightedOrderId);
        
        // Scroll to the order after a short delay to ensure it's rendered
        setTimeout(() => {
          const orderElement = orderRefs.current[highlightedOrderId];
          if (orderElement) {
            orderElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 300);

        // Remove the highlight after 5 seconds
        setTimeout(() => {
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('orderId');
            return newParams;
          });
        }, 5000);
      }
    }
  }, [highlightedOrderId, orders, setSearchParams]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

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
        items: itemsData.filter((item: any) => item.order_id === order.id)
      })) as OrderWithItems[];

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Не вдалося завантажити замовлення');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => order.status === activeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const name = order.customer_name || (order.delivery_info as any)?.full_name || '';
        const phone = order.customer_phone || (order.delivery_info as any)?.phone || '';
        const orderId = order.id.toLowerCase();
        return (
          name.toLowerCase().includes(term) ||
          phone.includes(term) ||
          orderId.includes(term)
        );
      });
    }
    
    setFilteredOrders(filtered);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingStatus(orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast.success('Статус замовлення оновлено');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Не вдалося оновити статус');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCreateTTN = async (orderId: string) => {
    try {
      const result = await createTTN(orderId);
      
      if (result.success && result.ttn) {
        const { error } = await supabase
          .from('orders')
          .update({ ttn: result.ttn })
          .eq('id', orderId);
          
        if (error) {
          console.error('Error updating order with TTN:', error);
          toast.error('TTN створено, але не вдалося зберегти в базу даних');
        } else {
          setOrders(orders.map(order => 
            order.id === orderId ? { ...order, ttn: result.ttn || null } : order
          ) as OrderWithItems[]);
          
          toast.success(`TTN успішно створено: ${result.ttn}`);
        }
      } else {
        toast.error(`Помилка створення TTN: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating TTN:', error);
      toast.error('Помилка створення TTN');
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Нове';
      case 'processing': return 'Обробляється';
      case 'shipped': return 'Відправлено';
      case 'delivered': return 'Доставлено';
      case 'cancelled': return 'Скасовано';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shipped': 
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': 
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': 
        return 'bg-red-100 text-red-800 border-red-200';
      default: 
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const isQuickOrder = (order: OrderWithItems) => {
    return order.delivery_method === 'quick_order';
  };

  const isNovaPoshtaOrder = (order: OrderWithItems) => {
    return order.delivery_method === 'nova_poshta_dept' || order.delivery_method === 'nova_poshta_courier';
  };

  const statusOptions: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (loading) {
    return <OrderListSkeleton count={8} />;
  }

  const stats = {
    total: orders.length,
    new: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.total_price || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Замовлення
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Управління всіма замовленнями
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Всього замовлень</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Нові</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.new}</p>
            </div>
            <Package className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>В обробці</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.processing}</p>
            </div>
            <Package className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Доставлено</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.delivered}</p>
            </div>
            <Truck className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Пошук за ім'ям, телефоном або ID замовлення..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex gap-2">
              {['all', 'new', 'processing', 'shipped', 'delivered', 'cancelled'].map((filter) => (
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
                   filter === 'new' ? 'Нові' :
                   filter === 'processing' ? 'В обробці' :
                   filter === 'shipped' ? 'Відправлено' :
                   filter === 'delivered' ? 'Доставлено' :
                   'Скасовано'}
          </button>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={() => {
              try {
                exportOrdersToCSV(filteredOrders);
                toast.success('Замовлення експортовано в CSV');
              } catch (error) {
                console.error('Error exporting orders:', error);
                toast.error('Помилка експорту замовлень');
              }
            }}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <Download size={18} />
            <span className="text-sm font-medium">Експорт CSV</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Замовлення не знайдені
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const isHighlighted = highlightedOrderId === order.id;
              return (
              <div 
                key={order.id} 
                ref={(el) => {
                  if (el) {
                    orderRefs.current[order.id] = el;
                  }
                }}
                className={`hover:bg-gray-50 transition-all duration-500 ${
                  isHighlighted 
                    ? 'bg-yellow-50 border-l-4 border-l-yellow-500 shadow-lg ring-2 ring-yellow-200 ring-opacity-50' 
                    : ''
                }`}
              >
                {/* Order Summary Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 sm:px-6 py-4 items-center">
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          #{String(order.id).substring(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {order.customer_name || (order.delivery_info as any)?.full_name || '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customer_phone || (order.delivery_info as any)?.phone || '—'}
                    </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <p className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {Number(order.total_price || 0).toLocaleString('uk-UA')} ₴
                    </p>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      disabled={updatingStatus === order.id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition-colors ${
                        getStatusBadgeClass(order.status)
                      } focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1 cursor-pointer disabled:opacity-50`}
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {getStatusText(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="lg:col-span-2 flex flex-wrap gap-2">
                    {order.ttn ? (
                      <a
                        href={`https://novaposhta.ua/tracking/?cargo_number=${order.ttn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg transition-colors"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Відстежити
                      </a>
                    ) : isQuickOrder(order) ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-800">
                        🔥 Швидке
                      </span>
                    ) : isNovaPoshtaOrder(order) ? (
                      <button
                        onClick={() => handleCreateTTN(order.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg transition-colors"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Створити ТТН
                      </button>
                    ) : null}
                  </div>
                  
                  <div className="lg:col-span-2 flex justify-end">
                    <button
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {expandedOrderId === order.id ? (
                        <>
                          <span>Згорнути</span>
                          <ChevronUp className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <span>Деталі</span>
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Expanded Order Details */}
                {expandedOrderId === order.id && (
                  <div className="px-4 sm:px-6 pb-6 border-t border-gray-200 pt-4 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Order Items */}
                      <div className="lg:col-span-2">
                        <h4 className="text-md font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Товари ({order.items.length})
                        </h4>
                        <div className="space-y-3">
                          {order.items.map((item) => {
                            const product = item.product as any;
                            return (
                              <div key={item.id} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200">
                                <img 
                                  src={product?.images?.[0] || '/placeholder.jpg'} 
                                  alt={product?.name || 'Товар'} 
                                  className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                    {product?.name || 'Товар'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Кількість: {item.quantity} × {item.price_at_purchase.toFixed(2)} ₴
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {(item.price_at_purchase * item.quantity).toFixed(2)} ₴
                              </p>
                            </div>
                            );
                          })}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <p className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              Загальна сума:
                            </p>
                            <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {Number(order.total_price || 0).toFixed(2)} ₴
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Delivery Info */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Доставка
                        </h4>
                        <div className="space-y-3 text-sm bg-white p-4 rounded-lg border border-gray-200">
                          <div>
                            <span className="font-medium text-gray-700">Тип:</span>
                            <p className="text-gray-900 mt-1">{getDeliveryMethodText(order.delivery_method)}</p>
                          </div>
                          {!isQuickOrder(order) && (
                            <>
                              <div>
                                <span className="font-medium text-gray-700">Отримувач:</span>
                                <p className="text-gray-900 mt-1">{(order.delivery_info as any)?.full_name || '—'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Телефон:</span>
                                <p className="text-gray-900 mt-1">{(order.delivery_info as any)?.phone || '—'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Місто:</span>
                                <p className="text-gray-900 mt-1">{(order.delivery_info as any)?.city || '—'}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Відділення:</span>
                                <p className="text-gray-900 mt-1">{(order.delivery_info as any)?.warehouse || '—'}</p>
                              </div>
                              {order.delivery_info?.comment && (
                                <div>
                                  <span className="font-medium text-gray-700">Коментар:</span>
                                  <p className="text-gray-900 mt-1">{(order.delivery_info as any).comment}</p>
                                </div>
                              )}
                            </>
                          )}
                          
                          {order.ttn && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="font-medium text-gray-700">TTN:</span>
                              <a 
                                href={`https://novaposhta.ua/tracking/?cargo_number=${order.ttn}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm break-all block mt-1"
                              >
                                {order.ttn}
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {!isQuickOrder(order) && !order.ttn && isNovaPoshtaOrder(order) && (
                          <button
                            onClick={() => handleCreateTTN(order.id)}
                            className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Створити ТТН
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
