import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product } from '../../types';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Image as ImageIcon,
  DollarSign,
  Tag,
  CheckCircle,
  XCircle,
  Download,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportProductsToCSV } from '../../utils/exportToCSV';
import { TableSkeleton } from '../../components/ui/SkeletonLoader';
import FeedImporter from '../../components/admin/FeedImporter';
import AttributeEditor from '../../components/admin/AttributeEditor';

interface ProductFormData {
  name: string;
  external_id: string;
  slug: string;
  description: string;
  price: number;
  old_price: number | null;
  in_stock: boolean;
  is_bestseller?: boolean;
  images: string[];
  attributes: Record<string, any>;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    external_id: '',
    slug: '',
    description: '',
    price: 0,
    old_price: null,
    in_stock: true,
    is_bestseller: false,
    images: [],
    attributes: {},
  });
  // attributesJson is no longer needed as we use AttributeEditor component
  const [imagesInput, setImagesInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*, is_bestseller')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProducts(data as Product[] || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Не вдалося завантажити товари');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(term) || 
      (product.external_id && product.external_id.toLowerCase().includes(term)) ||
      (product.slug && product.slug.toLowerCase().includes(term))
    );
    
    setFilteredProducts(filtered);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingProduct(null);
    setFormData({
      name: '',
      external_id: '',
      slug: '',
      description: '',
      price: 0,
      old_price: null,
      in_stock: true,
      is_bestseller: false,
      images: [],
      attributes: {},
    });
    setImagesInput('');
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setIsAdding(false);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      external_id: product.external_id || '',
      slug: product.slug || '',
      description: product.description || '',
      price: product.price,
      old_price: product.old_price || null,
      in_stock: product.in_stock,
      is_bestseller: product.is_bestseller || false,
      images: product.images || [],
      attributes: product.attributes || {},
    });
    setImagesInput((product.images || []).join('\n'));
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate form
      if (!formData.name.trim()) {
        toast.error('Назва товару обов\'язкова');
        return;
      }
      if (formData.price <= 0) {
        toast.error('Ціна повинна бути більше 0');
        return;
      }

      // Parse images
      const images = imagesInput
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      // Generate slug if not provided
      let slug = formData.slug.trim();
      if (!slug) {
        slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      const productData: any = {
        name: formData.name.trim(),
        external_id: formData.external_id.trim() || null,
        slug: slug,
        description: formData.description.trim() || null,
        price: formData.price,
        old_price: formData.old_price && formData.old_price > 0 ? formData.old_price : null,
        in_stock: formData.in_stock,
        is_bestseller: formData.is_bestseller || false,
        images: images,
        attributes: formData.attributes,
      };

      if (isAdding) {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;

        setProducts([data, ...products]);
        toast.success('Товар успішно додано');
      } else if (editingProduct) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()
          .single();

        if (error) throw error;

        setProducts(products.map(p => p.id === editingProduct.id ? data : p));
        toast.success('Товар успішно оновлено');
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      setIsAdding(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Не вдалося зберегти товар');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей товар? Цю дію неможливо скасувати.')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Товар успішно видалено');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Не вдалося видалити товар');
    }
  };

  const getStockStatus = (inStock: boolean) => {
    return inStock ? 'В наявності' : 'Немає';
  };

  const getStockStatusClass = (inStock: boolean) => {
    return inStock 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  if (loading) {
    return <TableSkeleton rows={10} columns={7} />;
  }

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.in_stock).length,
    outOfStock: products.filter(p => !p.in_stock).length,
    totalValue: products.reduce((sum, p) => sum + Number(p.price || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Товари
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Управління всіма товарами
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <Upload className="h-5 w-5 mr-2" />
            Імпорт фіду
          </button>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Додати новий товар
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Всього товарів</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>В наявності</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.inStock}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Немає в наявності</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Загальна вартість</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalValue.toLocaleString('uk-UA')} ₴</p>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Search and Export */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Пошук за назвою, артикулом або slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
          <button
            onClick={() => {
              try {
                exportProductsToCSV(filteredProducts);
                toast.success('Товари експортовано в CSV');
              } catch (error) {
                console.error('Error exporting products:', error);
                toast.error('Помилка експорту товарів');
              }
            }}
            disabled={filteredProducts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <Download size={18} />
            <span className="text-sm font-medium">Експорт CSV</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Зображення
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Назва
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Артикул
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ціна
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Наявність
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="h-16 w-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {product.name}
                    </div>
                    {product.slug && (
                      <div className="text-xs text-gray-500 mt-1">/{product.slug}</div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.external_id || '—'}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {product.old_price ? (
                      <div className="flex flex-col">
                        <span className="line-through text-gray-400 text-sm">{product.old_price.toFixed(2)} ₴</span>
                        <span className="font-medium text-red-600">{product.price.toFixed(2)} ₴</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{product.price.toFixed(2)} ₴</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStockStatusClass(product.in_stock)}`}>
                      {getStockStatus(product.in_stock)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Редагувати"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Товари не знайдені
            </p>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {isAdding ? 'Додати новий товар' : 'Редагувати товар'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Назва товару *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="external_id" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Артикул
                  </label>
                  <input
                    type="text"
                    id="external_id"
                    value={formData.external_id}
                    onChange={(e) => setFormData({...formData, external_id: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    placeholder="Автоматично згенерується, якщо порожнє"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Ціна (₴) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="old_price" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Стара ціна (₴)
                  </label>
                  <input
                    type="number"
                    id="old_price"
                    step="0.01"
                    min="0"
                    value={formData.old_price || ''}
                    onChange={(e) => setFormData({...formData, old_price: e.target.value ? parseFloat(e.target.value) : null})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.in_stock}
                      onChange={(e) => setFormData({...formData, in_stock: e.target.checked})}
                      className="rounded border-gray-300 text-gray-900 shadow-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      В наявності
                    </span>
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(editingProduct as any)?.is_bestseller || false}
                      onChange={async (e) => {
                        if (editingProduct) {
                          // Update the bestseller status in the database
                          try {
                            const { error } = await supabase
                              .from('products')
                              .update({ is_bestseller: e.target.checked })
                              .eq('id', editingProduct.id);
                            
                            if (error) throw error;
                            
                            // Update the local state
                            setProducts(products.map(p => 
                              p.id === editingProduct.id 
                                ? { ...p, is_bestseller: e.target.checked } 
                                : p
                            ));
                            
                            toast.success('Статус хіта продажу оновлено');
                          } catch (error) {
                            console.error('Error updating bestseller status:', error);
                            toast.error('Помилка оновлення статусу хіта продажу');
                          }
                        }
                      }}
                      className="rounded border-gray-300 text-gray-900 shadow-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Хіт продажу
                    </span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Опис
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* Images */}
              <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Зображення (по одному URL на рядок)
                </label>
                <textarea
                  id="images"
                  rows={3}
                  value={imagesInput}
                  onChange={(e) => setImagesInput(e.target.value)}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-sm"
                />
              </div>

              {/* Attributes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Атрибути
                </label>
                <AttributeEditor 
                  value={formData.attributes || {}}
                  onChange={(attributes) => setFormData({...formData, attributes})}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Додайте атрибути товару для кращого пошуку та фільтрації
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
                    Зберегти зміни
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Імпорт товарів з YML/XML
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <FeedImporter />
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
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