import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useFavorites } from '../hooks/useFavorites';
import { useUserStore } from '../features/auth/useUserStore';
import ProductCard from '../components/catalog/ProductCard';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { toast } from 'react-hot-toast';
import { ProductGridSkeleton } from '../components/ui/SkeletonLoader';
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  LayoutGrid, 
  List, 
  ArrowRight,
  Search
} from 'lucide-react';
import { formatPrice } from '../utils/helpers';

interface DbProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  description: string;
  images: string[];
  attributes: Record<string, any> | null;
  in_stock: boolean;
  created_at: string;
}

export default function Favorites() {
  const { session } = useUserStore();
  const { addItem } = useCartStore();
  const { favoriteIds, toggleFavorite, loading: favoritesLoading } = useFavorites();
  const userId = session?.user?.id;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const productIds = useMemo(() => {
    if (!favoriteIds || favoriteIds.size === 0) return [];
    return Array.from(favoriteIds).sort((a, b) => a - b);
  }, [favoriteIds]);

  const { data: favorites = [], isLoading: productsLoading } = useQuery({
    queryKey: ['favorites-products', userId, productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (productsError) throw productsError;
      
      return (productsData || []) as DbProduct[];
    },
    enabled: !favoritesLoading && productIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: [],
  });

  const loading = favoritesLoading || (productIds.length > 0 && productsLoading);

  // Filter favorites by search term
  const filteredFavorites = useMemo(() => {
    if (!searchTerm.trim()) return favorites;
    const term = searchTerm.toLowerCase();
    return favorites.filter(product => 
      product.name.toLowerCase().includes(term) ||
      (product.description?.toLowerCase().includes(term))
    );
  }, [favorites, searchTerm]);

  const removeFavorite = async (productId: number) => {
    try {
      await toggleFavorite(productId);
      toast.success('Товар видалено з обраних');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Помилка видалення з обраних');
    }
  };

  const addToCart = (product: DbProduct) => {
    try {
      const cartProduct = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        old_price: product.old_price,
        images: product.images,
        attributes: product.attributes || {},
        description: product.description,
        in_stock: product.in_stock
      };
      
      addItem(cartProduct);
      toast.success('Товар додано до кошика!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Помилка додавання до кошика');
    }
  };

  const clearAllFavorites = async () => {
    if (!window.confirm('Ви впевнені, що хочете видалити всі товари з обраних?')) return;
    
    try {
      for (const productId of productIds) {
        await toggleFavorite(productId);
      }
      toast.success('Всі товари видалено з обраних');
    } catch (error) {
      console.error('Error clearing favorites:', error);
      toast.error('Помилка видалення');
    }
  };

  // Remove the redirect for non-authenticated users and show favorites for all users
  // The useFavorites hook already handles local storage for non-authenticated users

  return (
    <div className="min-h-screen bg-[#FFF2E1] py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 
                className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-2 uppercase tracking-[2px]" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Список бажань
              </h1>
              <p 
                className="text-gray-600 text-sm md:text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {favorites.length > 0 
                  ? `${favorites.length} ${favorites.length === 1 ? 'товар' : 'товарів'} в обраних`
                  : 'Ваші обрані товари'}
              </p>
            </div>
            {favorites.length > 0 && (
              <button
                onClick={clearAllFavorites}
                className="inline-flex items-center gap-2 px-4 py-2 border border-black text-xs md:text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors uppercase tracking-[1px]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <Trash2 className="h-4 w-4" />
                Очистити все
              </button>
            )}
          </div>

          {/* Search and View Toggle */}
          {favorites.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Пошук в обраних..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-black bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>
              <div className="flex items-center gap-2 border border-black p-1 bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-black text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Сітка"
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-black text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Список"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : !favoritesLoading && (productIds.length === 0 || favorites.length === 0) ? (
          <div className="bg-white border border-black p-8 sm:p-12 text-center">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 
              className="text-xl font-medium text-gray-900 mb-2 uppercase tracking-[1px]" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Ваш список порожній
            </h3>
            <p 
              className="text-gray-600 mb-6 text-sm md:text-base"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Додайте товари до списку бажань, натиснувши на іконку серця
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors uppercase tracking-[1px]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Перейти до каталогу
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="bg-white border border-black p-8 sm:p-12 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 
              className="text-xl font-medium text-gray-900 mb-2 uppercase tracking-[1px]" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Нічого не знайдено
            </h3>
            <p 
              className="text-gray-600 mb-6 text-sm md:text-base"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Спробуйте інший пошуковий запит
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="inline-flex items-center gap-2 px-6 py-3 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors uppercase tracking-[1px]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Очистити пошук
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredFavorites.map((product) => (
              <div key={product.id} className="bg-white border border-black overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                <ProductCard
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  oldPrice={product.old_price}
                  image={product.images[0] || '/placeholder-product.jpg'}
                  rating={4}
                  description={product.description}
                />
                <div className="p-3 sm:p-4 pt-0">
                  <button
                    onClick={() => removeFavorite(product.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-black text-xs sm:text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors uppercase tracking-[1px]"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Видалити
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFavorites.map((product) => (
              <div key={product.id} className="bg-white border border-black overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
                  <Link
                    to={`/product/${encodeURIComponent(product.slug)}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={product.images[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-full sm:w-32 h-32 object-cover border border-black"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${encodeURIComponent(product.slug)}`}
                      className="block"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-gray-700 transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {product.name}
                      </h3>
                    </Link>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {formatPrice(product.price)}
                        </p>
                        {product.old_price && (
                          <p className="text-sm text-gray-500 line-through">
                            {formatPrice(product.old_price)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => removeFavorite(product.id)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-black text-xs sm:text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors uppercase tracking-[1px]"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Видалити
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}