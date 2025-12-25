import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { PromoCode } from '@/hooks/usePromoCode';
import { 
  Tag, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Percent,
  DollarSign,
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TableSkeleton } from '@/components/ui/SkeletonLoader';
import { formatDateTime } from '@/utils/helpers';

interface PromoCodeFormData {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  description: string;
}

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [filteredPromoCodes, setFilteredPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_amount: 0,
    max_uses: null,
    valid_from: '',
    valid_until: '',
    is_active: true,
    description: '',
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  useEffect(() => {
    filterPromoCodes();
  }, [promoCodes, searchTerm, activeTab]);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      
      
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPromoCodes(data as PromoCode[] || []);
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      toast.error('Не вдалося завантажити промокоди');
    } finally {
      setLoading(false);
    }
  };

  const filterPromoCodes = () => {
    let filtered = [...promoCodes];

    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(promo => 
        promo.code.toLowerCase().includes(term) ||
        (promo.description && promo.description.toLowerCase().includes(term))
      );
    }

    
    const now = new Date();
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(promo => 
          promo.is_active &&
          (!promo.valid_from || new Date(promo.valid_from) <= now) &&
          (!promo.valid_until || new Date(promo.valid_until) >= now) &&
          (promo.max_uses === null || promo.used_count < promo.max_uses)
        );
        break;
      case 'inactive':
        filtered = filtered.filter(promo => !promo.is_active);
        break;
      case 'expired':
        filtered = filtered.filter(promo => 
          promo.valid_until && new Date(promo.valid_until) < now
        );
        break;
      default:
        
        break;
    }

    setFilteredPromoCodes(filtered);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingPromoCode(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_amount: 0,
      max_uses: null,
      valid_from: '',
      valid_until: '',
      is_active: true,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (promoCode: PromoCode) => {
    setIsAdding(false);
    setEditingPromoCode(promoCode);
    setFormData({
      code: promoCode.code,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      min_order_amount: promoCode.min_order_amount,
      max_uses: promoCode.max_uses,
      valid_from: promoCode.valid_from ? new Date(promoCode.valid_from).toISOString().slice(0, 16) : '',
      valid_until: promoCode.valid_until ? new Date(promoCode.valid_until).toISOString().slice(0, 16) : '',
      is_active: promoCode.is_active,
      description: promoCode.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      
      if (!formData.code.trim()) {
        toast.error('Код промокоду обов\'язковий');
        return;
      }
      if (formData.discount_value <= 0) {
        toast.error('Значення знижки повинно бути більше 0');
        return;
      }
      if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
        toast.error('Відсоток знижки не може перевищувати 100%');
        return;
      }
      if (formData.valid_from && formData.valid_until && 
          new Date(formData.valid_from) >= new Date(formData.valid_until)) {
        toast.error('Дата початку повинна бути раніше дати закінчення');
        return;
      }

      const promoCodeData: any = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_order_amount: formData.min_order_amount || 0,
        max_uses: formData.max_uses && formData.max_uses > 0 ? formData.max_uses : null,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        is_active: formData.is_active,
        description: formData.description.trim() || null,
      };

      if (isAdding) {
        
        const { data, error } = await supabase
          .from('promo_codes')
          .insert([promoCodeData])
          .select()
          .single();

        if (error) throw error;

        setPromoCodes([data, ...promoCodes]);
        toast.success('Промокод успішно створено');
      } else if (editingPromoCode) {
        
        const { data, error } = await supabase
          .from('promo_codes')
          .update(promoCodeData)
          .eq('id', editingPromoCode.id)
          .select()
          .single();

        if (error) throw error;

        setPromoCodes(promoCodes.map(p => p.id === editingPromoCode.id ? data : p));
        toast.success('Промокод успішно оновлено');
      }

      setIsModalOpen(false);
      setEditingPromoCode(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Error saving promo code:', error);
      if (error.code === '23505') {
        toast.error('Промокод з таким кодом вже існує');
      } else {
        toast.error(error.message || 'Не вдалося зберегти промокод');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promoCodeId: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей промокод? Цю дію неможливо скасувати.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', promoCodeId);

      if (error) throw error;

      setPromoCodes(promoCodes.filter(p => p.id !== promoCodeId));
      toast.success('Промокод успішно видалено');
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      toast.error('Не вдалося видалити промокод');
    }
  };

  const getStatusBadge = (promoCode: PromoCode) => {
    const now = new Date();
    const isExpired = promoCode.valid_until && new Date(promoCode.valid_until) < now;
    const isNotStarted = promoCode.valid_from && new Date(promoCode.valid_from) > now;
    const isMaxUsesReached = promoCode.max_uses !== null && promoCode.used_count >= promoCode.max_uses;

    if (!promoCode.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <XCircle className="w-3 h-3 mr-1" />
          Неактивний
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <Clock className="w-3 h-3 mr-1" />
          Закінчився
        </span>
      );
    }

    if (isNotStarted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Очікує старту
        </span>
      );
    }

    if (isMaxUsesReached) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
          <Users className="w-3 h-3 mr-1" />
          Вичерпано
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Активний
      </span>
    );
  };

  const formatDiscount = (promoCode: PromoCode) => {
    if (promoCode.discount_type === 'percentage') {
      return `${promoCode.discount_value}%`;
    }
    return `${promoCode.discount_value.toFixed(2)} ₴`;
  };

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />;
  }

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter(p => {
      const now = new Date();
      return p.is_active &&
        (!p.valid_from || new Date(p.valid_from) <= now) &&
        (!p.valid_until || new Date(p.valid_until) >= now) &&
        (p.max_uses === null || p.used_count < p.max_uses);
    }).length,
    inactive: promoCodes.filter(p => !p.is_active).length,
    expired: promoCodes.filter(p => p.valid_until && new Date(p.valid_until) < new Date()).length,
    totalUsed: promoCodes.reduce((sum, p) => sum + p.used_count, 0),
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Промокоди
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Управління промокодами та знижками
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Створити промокод
        </button>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Всього</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Tag className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Активні</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Неактивні</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</p>
            </div>
            <XCircle className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Закінчилися</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.expired}</p>
            </div>
            <Clock className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Використано</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsed}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Пошук за кодом або описом..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex gap-2 overflow-x-auto">
              {[
                { key: 'all', label: 'Всі', count: stats.total },
                { key: 'active', label: 'Активні', count: stats.active },
                { key: 'inactive', label: 'Неактивні', count: stats.inactive },
                { key: 'expired', label: 'Закінчилися', count: stats.expired }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Код
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Знижка
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Мін. сума
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Використано
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Термін дії
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
              {filteredPromoCodes.map((promoCode) => (
                <tr key={promoCode.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {promoCode.code}
                    </div>
                    {promoCode.description && (
                      <div className="text-xs text-gray-500 mt-1">{promoCode.description}</div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {promoCode.discount_type === 'percentage' ? (
                        <Percent className="h-4 w-4 text-gray-400" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{formatDiscount(promoCode)}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {promoCode.min_order_amount > 0 
                        ? `${promoCode.min_order_amount.toFixed(2)} ₴`
                        : 'Без обмежень'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {promoCode.used_count}
                      {promoCode.max_uses !== null && (
                        <span className="text-gray-500"> / {promoCode.max_uses}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {promoCode.valid_from ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateTime(promoCode.valid_from, true)}</span>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                      {promoCode.valid_until && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs">до</span>
                          <span>{formatDateTime(promoCode.valid_until, true)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(promoCode)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(promoCode)}
                        className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Редагувати"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promoCode.id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Видалити"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPromoCodes.length === 0 && (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Промокоди не знайдені
            </p>
          </div>
        )}
      </div>

      {}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {isAdding ? 'Створити промокод' : 'Редагувати промокод'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Код промокоду *
                </label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="НАПРИКЛАД10"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent uppercase"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Код буде автоматично перетворено на великі літери
                </p>
              </div>

              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Тип знижки *
                  </label>
                  <select
                    id="discount_type"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({...formData, discount_type: e.target.value as 'percentage' | 'fixed'})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="percentage">Відсоток (%)</option>
                    <option value="fixed">Фіксована сума (₴)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Значення знижки *
                  </label>
                  <input
                    type="number"
                    id="discount_value"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.discount_type === 'percentage' 
                      ? 'Від 0 до 100%'
                      : 'Фіксована сума в гривнях'}
                  </p>
                </div>
              </div>

              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="min_order_amount" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Мінімальна сума замовлення (₴)
                  </label>
                  <input
                    type="number"
                    id="min_order_amount"
                    step="0.01"
                    min="0"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({...formData, min_order_amount: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    0 = без обмежень
                  </p>
                </div>
                
                <div>
                  <label htmlFor="max_uses" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Максимальна кількість використань
                  </label>
                  <input
                    type="number"
                    id="max_uses"
                    min="1"
                    value={formData.max_uses || ''}
                    onChange={(e) => setFormData({...formData, max_uses: e.target.value ? parseInt(e.target.value, 10) : null})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Без обмежень"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Залиште порожнім для необмеженої кількості
                  </p>
                </div>
              </div>

              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Дата початку дії
                  </label>
                  <input
                    type="datetime-local"
                    id="valid_from"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Залиште порожнім для негайного старту
                  </p>
                </div>
                
                <div>
                  <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Дата закінчення дії
                  </label>
                  <input
                    type="datetime-local"
                    id="valid_until"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Залиште порожнім для безстрокової дії
                  </p>
                </div>
              </div>

              {}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Опис
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Опис промокоду (опціонально)"
                />
              </div>

              {}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded border-gray-300 text-gray-900 shadow-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Активний промокод
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  Неактивні промокоди не можуть бути використані
                </p>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Скасувати
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Збереження...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Зберегти
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

