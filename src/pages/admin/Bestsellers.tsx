import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Save, Plus, X, GripVertical, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import { DraggableList } from '@/components/admin/DraggableList';

interface BestsellerItem {
  id: string;
  product_id: number;
  position: number;
  created_at: string;
  product?: Product;
}

export default function Bestsellers() {
  const [bestsellers, setBestsellers] = useState<BestsellerItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch bestsellers with product data
      const { data: bestsellersData, error: bestsellersError } = await supabase
        .from('bestsellers')
        .select(`
          *,
          products (*)
        `)
        .order('position', { ascending: true });

      if (bestsellersError) throw bestsellersError;

      // Fetch all products for selector
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;

      setBestsellers(bestsellersData || []);
      setAllProducts(productsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Не вдалося завантажити дані');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBestseller = async (productId: number) => {
    try {
      const newPosition = bestsellers.length > 0 ? Math.max(...bestsellers.map(b => b.position)) + 1 : 1;
      
      const { data, error } = await supabase
        .from('bestsellers')
        .insert([
          {
            product_id: productId,
            position: newPosition
          }
        ])
        .select(`
          *,
          products (*)
        `);

      if (error) throw error;

      if (data && data[0]) {
        setBestsellers(prev => [...prev, data[0]]);
        toast.success('Товар додано до хітів продажу');
      }
    } catch (error: any) {
      console.error('Error adding bestseller:', error);
      toast.error('Не вдалося додати товар до хітів');
    }
  };

  const handleRemoveBestseller = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bestsellers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBestsellers(prev => prev.filter(b => b.id !== id));
      toast.success('Товар видалено з хітів продажу');
    } catch (error: any) {
      console.error('Error removing bestseller:', error);
      toast.error('Не вдалося видалити товар з хітів');
    }
  };

  const handleReorder = async (newOrder: BestsellerItem[]) => {
    try {
      setSaving(true);
      
      // Update positions for all items
      const updates = newOrder.map((item, index) => 
        supabase
          .from('bestsellers')
          .update({ position: index + 1 })
          .eq('id', item.id)
      );

      const results = await Promise.all(updates);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Не вдалося оновити порядок');
      }

      setBestsellers(newOrder);
      toast.success('Порядок успішно збережено');
    } catch (error: any) {
      console.error('Error reordering bestsellers:', error);
      toast.error(error.message || 'Не вдалося зберегти порядок');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !bestsellers.some(b => b.product_id === product.id)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Хіти продажу
          </h1>
        </div>
        
        <div className="bg-white shadow rounded-lg border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Хіти продажу
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Управління товарами, що відображаються в секції хітів продажу
          </p>
        </div>
        <button
          onClick={() => setShowProductSelector(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Додати товар
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Перетягуйте товари для зміни їх порядку
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Перший товар у списку буде відображатися першим у секції хітів продажу
          </p>
        </div>
      </div>

      {/* Bestsellers List */}
      {bestsellers.length > 0 ? (
        <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
          <DraggableList
            items={bestsellers}
            onReorder={handleReorder}
            renderItem={(item, index, dragHandleProps) => (
              <div className="flex items-center gap-4 p-4 border-b border-gray-200 last:border-b-0">
                <div 
                  {...dragHandleProps}
                  className="cursor-move text-gray-400 hover:text-gray-600"
                >
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-1 flex items-center gap-4">
                  {item.product?.images && item.product.images.length > 0 && (
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{item.product?.name || 'Невідомий товар'}</h3>
                    <p className="text-sm text-gray-500">#{item.product?.external_id || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Позиція: {item.position}
                </div>
                <button
                  onClick={() => handleRemoveBestseller(item.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Видалити з хітів"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Немає хітів продажу
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Додайте товари до хітів продажу, щоб вони відображалися на головній сторінці.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowProductSelector(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Додати перший товар
            </button>
          </div>
        </div>
      )}

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Виберіть товар
                </h2>
                <button
                  onClick={() => setShowProductSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Search */}
              <div className="mt-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Пошук товарів..."
                />
              </div>
            </div>
            
            {/* Products List */}
            <div className="flex-1 overflow-y-auto">
              {filteredProducts.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        {product.images && product.images.length > 0 && (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500">#{product.external_id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleAddBestseller(Number(product.id));
                          setShowProductSelector(false);
                          setSearchTerm('');
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Додати
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500">Товари не знайдено</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowProductSelector(false)}
                className="w-full inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}