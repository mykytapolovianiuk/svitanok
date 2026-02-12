import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, Plus, Minus, Maximize2 } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAnalytics } from '../hooks/useAnalytics';
import ProductReviews from '../components/reviews/ProductReviews';
import QuickOrderModal from '../components/modals/QuickOrderModal';
import { ProductPageSkeleton } from '../components/ui/SkeletonLoader';
import ImageZoom from '../components/product/ImageZoom';
import StockIndicator from '../components/product/StockIndicator';
import FrequentlyBoughtTogether from '../components/product/FrequentlyBoughtTogether';
import RecommendedProducts from '../components/product/RecommendedProducts';
import ImageLightbox from '../components/product/ImageLightbox';
import { useFavorites } from '../hooks/useFavorites';
import { useProductReviews } from '../hooks/useProductReviews';
import Spinner from '../components/ui/Spinner';
import SEOHead from '../components/seo/SEOHead';
import { ProductStructuredData } from '../components/seo/StructuredData';
import Breadcrumbs from '../components/common/Breadcrumbs';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  images: string[];
  attributes: Record<string, any>;
  description: string;
  in_stock: boolean;
  brand_id?: number; // Add brand_id from new schema
  category_id?: string; // Add category_id from new schema
  brands?: {
    id: number;
    name: string;
  };
  categories?: {
    id: string;
    name: string;
  };
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { trackViewItem, trackAddToCart, trackFavorite } = useAnalytics();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Get product reviews stats
  const { stats: reviewStats } = useProductReviews(product?.id || 0);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when scrolled past 400px
      setShowStickyBar(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!slug) {
      setError('Product not specified');
      setLoading(false);
      return;
    }

    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!slug) {
        setError('Product not specified');
        setLoading(false);
        return;
      }

      // Decode slug to handle URL-encoded Cyrillic characters
      const decodedSlug = decodeURIComponent(slug);

      // Try to find product by decoded slug first
      let { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          brands (id, name),
          categories (id, name)
        `)
        .eq('slug', decodedSlug)
        .single();

      // If not found, try with original slug (in case it's already decoded)
      if (fetchError && slug !== decodedSlug) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select(`
            *,
            brands (id, name),
            categories (id, name)
          `)
          .eq('slug', slug)
          .single();

        if (!fallbackError && fallbackData) {
          data = fallbackData;
          fetchError = null;
        }
      }

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Product not found');

      setProduct(data);
      setSelectedImage(0);

      // Track product view
      trackViewItem({
        id: data.id,
        name: data.name,
        price: data.price,
        category: data.attributes?.Назва_групи || data.attributes?.Category,
        brand: data.attributes?.Виробник || data.attributes?.Brand,
      });

      // Note: We no longer fetch recommended products here since RecommendedProducts component handles it
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    try {
      await toggleFavorite(product.id);
      trackFavorite(favoriteIds.has(product.id) ? 'remove' : 'add', product.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isFavorite = product ? favoriteIds.has(product.id) : false;



  const handleAddToCart = async () => {
    if (!product || isAddingToCart) return;

    setIsAddingToCart(true);

    try {
      // Add multiple items if quantity > 1
      for (let i = 0; i < quantity; i++) {
        addItem(product);
      }

      // Track add to cart
      trackAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        category: product.attributes?.Назва_групи || product.attributes?.Category,
        brand: product.attributes?.Виробник || product.attributes?.Brand,
      });

      // Auto-open cart
      openCart();
    } finally {
      setTimeout(() => setIsAddingToCart(false), 300);
    }
  };

  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    if (value > 99) return;
    setQuantity(value);
  };

  const toggleTab = (tab: 'description' | 'attributes') => {
    setActiveTab(tab);
  };

  if (loading) {
    return <ProductPageSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Помилка</h1>
        <p className="text-gray-600 mb-6">{error || 'Продукт не знайдено'}</p>
        <button
          onClick={() => navigate('/catalog')}
          className="px-6 py-3 bg-black text-white rounded hover:opacity-90 transition"
        >
          Повернутися до каталогу
        </button>
      </div>
    );
  }

  const discountPercentage = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  // Define which attributes to show in the table
  const importantAttributes = [
    'Виробник',
    'Країна',
    'Об\'єм',
    'Тип шкіри',
    'Вік',
    'Класифікація',
    'Призначення'
  ];

  // Filter attributes to show only important ones
  const filteredAttributes = Object.fromEntries(
    Object.entries(product.attributes || {}).filter(([key]) =>
      importantAttributes.includes(key)
    )
  );

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://svitanok.com';
  const productImage = product.images && product.images.length > 0
    ? (product.images[0].startsWith('http') ? product.images[0] : `${siteUrl}${product.images[0]}`)
    : `${siteUrl}/placeholder-product.jpg`;

  return (
    <>
      <SEOHead
        title={product.name}
        description={product.description || `Купити ${product.name} в інтернет-магазині Svitanok. Якісна косметика з доставкою по Україні.`}
        image={productImage}
        url={`/product/${encodeURIComponent(product.slug)}`}
        type="product"
        keywords={`${product.name}, косметика, ${product.attributes?.Виробник || ''}, ${product.attributes?.Назва_групи || ''}`}
        canonical={`${siteUrl}/product/${encodeURIComponent(product.slug)}`}
      />
      {product && (
        <ProductStructuredData
          product={{
            name: product.name,
            description: product.description,
            image: product.images || [],
            price: product.price,
            currency: 'UAH',
            availability: product.in_stock ? 'InStock' : 'OutOfStock',
            brand: product.attributes?.Виробник || product.attributes?.Brand,
            category: product.attributes?.Назва_групи || product.attributes?.Category,
            sku: product.id.toString(),
          }}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />

        {/* Product Detail - Restructured Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Main Image Column - Left */}
          <div className="lg:col-span-6">
            <div className="relative">
              <div
                className="aspect-square flex items-center justify-center relative group cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              >
                <ImageZoom
                  src={product.images[selectedImage] || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full"
                />
                {/* Lightbox Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow opacity-0 group-hover:opacity-100 z-20"
                  aria-label="Відкрити в повноекранному режимі"
                >
                  <Maximize2 size={18} className="text-gray-700" />
                </button>
              </div>
              {/* Wishlist Badge */}
              <button
                onClick={handleToggleFavorite}
                className="absolute top-4 right-4 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow z-10"
                aria-label={isFavorite ? 'Видалити з обраних' : 'Додати до обраних'}
              >
                <Heart
                  size={18}
                  className={isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-gray-400'}
                />
              </button>

              {/* Mobile Image Thumbnails */}
              {product.images.length > 1 && (
                <div className="lg:hidden flex gap-2 mt-4 justify-center">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 border-2 transition-colors ${selectedImage === index ? 'border-black' : 'border-gray-200'
                        }`}
                    >
                      <img
                        src={image || '/placeholder-product.jpg'}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Image Thumbnails */}
            {product.images.length > 1 && (
              <div className="hidden lg:grid grid-cols-5 gap-3 mt-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square border-2 transition-colors ${selectedImage === index ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                      }`}
                  >
                    <img
                      src={image || '/placeholder-product.jpg'}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info and Characteristics Column - Right */}
          <div className="lg:col-span-6">
            <div className="lg:sticky lg:top-4">
              {/* Product Info */}
              <div className="mb-8">
                <h1
                  className="text-2xl font-light mb-4 uppercase tracking-[2px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {product.name}
                </h1>

                {/* Rating */}
                {reviewStats && reviewStats.totalReviews > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${star <= Math.round(reviewStats.averageRating)
                            ? 'fill-current text-yellow-400'
                            : 'fill-none text-gray-300'
                            }`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'відгук' : reviewStats.totalReviews < 5 ? 'відгуки' : 'відгуків'})
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-4 mb-4">
                  <span
                    className="text-3xl font-light"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {product.price.toFixed(2)} ₴
                  </span>
                  {product.old_price && (
                    <>
                      <span
                        className="text-xl text-gray-400 line-through"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {product.old_price.toFixed(2)} ₴
                      </span>
                      <span className="px-2 py-1 bg-black text-white text-xs font-medium uppercase tracking-[1px]">
                        -{discountPercentage}%
                      </span>
                    </>
                  )}
                </div>

                {/* Stock Indicator */}
                <div className="mb-6">
                  <StockIndicator inStock={product.in_stock} />
                </div>

                {/* Actions */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
                    <div className="flex items-center border border-gray-300 w-full sm:w-auto justify-center sm:justify-start">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        className="p-2 md:p-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        disabled={quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span
                        className="px-4 md:px-6 py-2 text-sm md:text-base font-medium min-w-[50px] text-center"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="p-2 md:p-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        disabled={quantity >= 99}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={!product.in_stock || isAddingToCart}
                      className="flex-1 border border-black py-3 md:py-4 text-center hover:bg-black hover:text-white transition-colors duration-300 uppercase tracking-[1px] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {isAddingToCart && <Spinner size="sm" />}
                      {isAddingToCart ? 'Додавання...' : 'КУПИТИ'}
                    </button>
                  </div>

                  {/* Quick Order Button */}
                  <button
                    onClick={() => setIsQuickOrderOpen(true)}
                    className="w-full py-3 md:py-4 bg-black text-white text-center hover:opacity-90 transition-opacity uppercase tracking-[1px] text-sm font-medium"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Купити в 1 клік
                  </button>
                </div>

                {/* Characteristics moved here - below cart buttons */}
                <div className="border border-[#FFF8F1] bg-[#FFF8F1]">
                  <div className="p-5">
                    <h3
                      className="font-medium uppercase tracking-wider mb-3"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Характеристики
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(filteredAttributes).map(([key, value]) => (
                        <div key={key} className="flex flex-wrap gap-2">
                          <span
                            className="font-medium text-sm min-w-[120px]"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            {key}:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(value) ? (
                              value.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="bg-white px-2 py-1 rounded text-xs border border-gray-200"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                >
                                  {String(item)}
                                </span>
                              ))
                            ) : typeof value === 'string' && value.includes('|') ? (
                              value.split('|').map((item, idx) => (
                                <span
                                  key={idx}
                                  className="bg-white px-2 py-1 rounded text-xs border border-gray-200"
                                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                                >
                                  {item.trim()}
                                </span>
                              ))
                            ) : (
                              <span
                                className="bg-white px-2 py-1 rounded text-xs border border-gray-200"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}
                              >
                                {String(value)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Removed characteristics section from here since it's moved above */}
            </div>
          </div>
        </div>

        {/* Frequently Bought Together */}
        {product && <FrequentlyBoughtTogether productId={product.id} />}

        {/* Recommendations Section */}
        {product && product.brand_id && product.category_id && (
          <RecommendedProducts
            currentProduct={{
              id: product.id,
              brand_id: product.brand_id,
              category_id: product.category_id
            }}
          />
        )}

        {/* Full-width Description Section at Bottom */}
        <div className="mt-12 border border-[#FFF8F1] bg-[#FFF8F1]">
          <div className="p-8">
            <h2
              className="font-medium uppercase tracking-wider mb-4 text-center"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Опис
            </h2>
            <div
              className="prose max-w-none text-gray-600 text-sm text-center mx-auto max-w-3xl"
              dangerouslySetInnerHTML={{ __html: product.description }}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
        </div>

        {/* Product Reviews */}
        <div className="mt-12">
          <ProductReviews productId={product.id} />
        </div>

        {/* Quick Order Modal */}
        {product && (
          <QuickOrderModal
            isOpen={isQuickOrderOpen}
            onClose={() => setIsQuickOrderOpen(false)}
            product={{
              id: product.id,
              name: product.name,
              price: product.price
            }}
          />
        )}

        {/* Image Lightbox */}
        {product && (
          <ImageLightbox
            isOpen={isLightboxOpen}
            onClose={() => setIsLightboxOpen(false)}
            images={product.images}
            currentIndex={selectedImage}
            onIndexChange={setSelectedImage}
            productName={product.name}
          />
        )}

        {/* Sticky Mobile Add to Cart Bar */}
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-40 lg:hidden transform transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'
            }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3
                className="text-xs font-medium uppercase truncate mb-1"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {product.name}
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className="text-lg font-medium"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {product.price.toFixed(2)} ₴
                </span>
                {product.old_price && (
                  <span
                    className="text-sm text-gray-400 line-through"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {product.old_price.toFixed(2)} ₴
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!product.in_stock || isAddingToCart}
              className="bg-black text-white px-6 py-3 text-sm font-medium uppercase tracking-wider hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex justify-center items-center"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {isAddingToCart ? <Spinner size="sm" /> : 'В кошик'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}