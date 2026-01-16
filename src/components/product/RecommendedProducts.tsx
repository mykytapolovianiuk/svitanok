import { useEffect, useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
// @ts-expect-error
import 'swiper/css';
// @ts-expect-error
import 'swiper/css/navigation';
// @ts-expect-error
import 'swiper/css/pagination';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useCartStore } from '@/store/cartStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useProductReviews } from '@/hooks/useProductReviews';
import { toast } from 'react-hot-toast';
import { formatPrice } from '@/utils/helpers';
import { supabase } from '@/lib/supabase';

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
  brand_id: number;
  category_id: string;
  brands?: {
    id: number;
    name: string;
  };
  categories?: {
    id: string;
    name: string;
  };
}

interface RecommendedProductsProps {
  currentProduct: Pick<Product, 'id' | 'brand_id' | 'category_id'>;
}

// Brands that use "Lines" (Category = Line) - Strategy A
const LINE_BASED_BRANDS = [1, 2, 3]; // Smart4derma and similar brands

// Check if brand uses line-based categorization
const isLineBasedBrand = (brandId: number): boolean => {
  return LINE_BASED_BRANDS.includes(brandId);
};

// Check if product belongs to a line-based brand via attributes
const hasLineAttribute = (attributes: Record<string, any>): boolean => {
  const cosmeticClass = attributes?.['Клас косметики']?.toLowerCase();
  return cosmeticClass === 'професійна' || cosmeticClass === 'лінійна';
};

function RecommendedProductCard({ product }: { product: Product }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem } = useCartStore();
  const { trackAddToCart, trackFavorite } = useAnalytics();
  const { data: reviewStats } = useProductReviews(product.id);
  const rating = reviewStats?.averageRating || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    toast.success('Товар додано до кошика!');
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasFavorite = isFavorite(product.id);
    toggleFavorite(product.id);
    trackFavorite(wasFavorite ? 'remove' : 'add', product.id);
  };

  const discountPercent = product.old_price && product.old_price > product.price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  return (
    <div className="bg-white border border-black overflow-hidden flex flex-col h-full">
      <Link 
        to={`/product/${encodeURIComponent(product.slug)}`}
        className="block flex-1"
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2 left-2 z-10 bg-black text-white px-2 py-1 text-xs font-bold uppercase">
              ЗНИЖКА {discountPercent}%
            </div>
          )}
          
          {/* Heart Icon */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 hover:bg-white transition-colors"
          >
            <Heart
              size={16}
              className={`${isFavorite(product.id) ? 'fill-black stroke-black' : 'stroke-black'}`}
            />
          </button>

          {/* Product Image */}
          <img
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Brand Name */}
          {product.brands?.name && (
            <div className="text-[10px] text-gray-500 text-center uppercase tracking-wider mb-1">
              {product.brands.name}
            </div>
          )}
          
          {/* Product Name */}
          <h3
            className="text-sm font-medium uppercase text-center underline underline-offset-4 mb-2 line-clamp-2 min-h-[40px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-[10px] text-gray-500 text-center line-clamp-2 mb-3 min-h-[30px]">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="text-center mb-3">
            {product.old_price ? (
              <div>
                <span className="text-sm line-through text-gray-400 mr-2">
                  {formatPrice(product.old_price)}
                </span>
                <span className="text-lg font-medium">
                  {formatPrice(product.price)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-medium">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <span 
                key={i} 
                className={`text-xs ${i < Math.round(rating) ? 'text-black' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        className="w-full border border-black py-3 text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-300"
        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}
      >
        КУПИТИ
      </button>
    </div>
  );
}

export default function RecommendedProducts({ currentProduct }: RecommendedProductsProps) {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentProduct?.id || !currentProduct?.brand_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Step 1: Fetch candidate products from the same brand
        const { data: candidates, error } = await supabase
          .from('products')
          .select(`
            *,
            brands (*),
            categories (*)
          `)
          .eq('brand_id', currentProduct.brand_id)
          .neq('id', currentProduct.id)
          .limit(20);

        if (error) throw error;

        // Step 2: Determine recommendation strategy
        const isLineBrand = isLineBasedBrand(currentProduct.brand_id);
        const hasLineAttr = candidates?.some(p => hasLineAttribute(p.attributes)) ?? false;
        const useLineStrategy = isLineBrand || hasLineAttr;

        // Step 3: Apply filtering strategy
        let filteredProducts: Product[] = [];
        
        if (useLineStrategy && candidates) {
          // Strategy A: Same Brand + Same Category (Line-based)
          filteredProducts = candidates.filter(
            product => product.category_id === currentProduct.category_id
          );
        } else if (candidates) {
          // Strategy B: Same Brand + Different Categories (Cross-sell)
          filteredProducts = candidates.filter(
            product => product.category_id !== currentProduct.category_id
          );
        }

        // Step 4: Sort by relevance (best sellers first, then by ID)
        filteredProducts.sort((a, b) => {
          const aIsBestSeller = a.attributes?.is_bestseller === true;
          const bIsBestSeller = b.attributes?.is_bestseller === true;
          
          if (aIsBestSeller && !bIsBestSeller) return -1;
          if (!aIsBestSeller && bIsBestSeller) return 1;
          return a.id - b.id;
        });

        // Step 5: Get initial recommendations (limit to 6)
        let finalProducts = filteredProducts.slice(0, 6);

        // Step 6: Robust fallback logic
        // If we don't have enough recommendations, fetch bestsellers
        if (finalProducts.length < 6) {
          const needed = 6 - finalProducts.length;
          
          // Try bestsellers first
          const { data: bestsellers } = await supabase
            .from('products')
            .select(`
              *,
              brands (*),
              categories (*)
            `)
            .neq('id', currentProduct.id)
            .eq('attributes->>is_bestseller', 'true')
            .limit(needed * 2); // Get more to have variety

          if (bestsellers && bestsellers.length > 0) {
            // Filter out any products we already have
            const uniqueBestsellers = bestsellers.filter(
              bs => !finalProducts.some(fp => fp.id === bs.id)
            ).slice(0, needed);
            
            finalProducts = [...finalProducts, ...uniqueBestsellers];
          }
        }

        // Step 7: Last resort fallback - newest products
        if (finalProducts.length < 4) {
          const needed = 4 - finalProducts.length;
          
          const { data: newestProducts } = await supabase
            .from('products')
            .select(`
              *,
              brands (*),
              categories (*)
            `)
            .neq('id', currentProduct.id)
            .order('created_at', { ascending: false })
            .limit(needed * 2);

          if (newestProducts && newestProducts.length > 0) {
            // Filter out any products we already have
            const uniqueNewest = newestProducts.filter(
              np => !finalProducts.some(fp => fp.id === np.id)
            ).slice(0, needed);
            
            finalProducts = [...finalProducts, ...uniqueNewest];
          }
        }

        // Final safeguard - ensure we have at least some recommendations
        if (finalProducts.length === 0) {
          // Ultimate fallback - get any random products
          const { data: randomProducts } = await supabase
            .from('products')
            .select(`
              *,
              brands (*),
              categories (*)
            `)
            .neq('id', currentProduct.id)
            .limit(6);

          finalProducts = randomProducts || [];
        }

        setRecommendedProducts(finalProducts.slice(0, 6));
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        
        // Emergency fallback - try to get some products anyway
        try {
          const { data: fallbackProducts } = await supabase
            .from('products')
            .select(`
              *,
              brands (*),
              categories (*)
            `)
            .neq('id', currentProduct.id)
            .limit(3);
          
          setRecommendedProducts(fallbackProducts || []);
        } catch (fallbackError) {
          console.error('Emergency fallback failed:', fallbackError);
          setRecommendedProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProduct]);

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
          <h2
            className="text-2xl md:text-3xl font-light mb-8 uppercase tracking-[2px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ЩО МИ РЕКОМЕНДУЄМО З ЦИМ...
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 aspect-[3/4] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        <h2
          className="text-2xl md:text-3xl font-light mb-8 uppercase tracking-[2px]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          ЩО МИ РЕКОМЕНДУЄМО З ЦИМ...
        </h2>
        
        {/* Desktop Grid View - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 mb-8">
          {recommendedProducts.map((product) => (
            <div key={product.id} className="h-full">
              <RecommendedProductCard product={product} />
            </div>
          ))}
        </div>
        
        {/* Mobile Slider View - Hidden on desktop */}
        <div className="md:hidden">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={16}
            slidesPerView={1.2}
            breakpoints={{
              640: {
                slidesPerView: 1.5,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
              1280: {
                slidesPerView: 5,
                spaceBetween: 24,
              },
            }}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet !bg-black',
              bulletActiveClass: 'swiper-pagination-bullet-active !bg-black',
            }}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            loop={recommendedProducts.length > 2}
            className="recommended-products-swiper"
          >
            {recommendedProducts.map((product) => (
              <SwiperSlide key={product.id} className="h-full">
                <div className="h-full">
                  <RecommendedProductCard product={product} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Custom Navigation Buttons */}
          <div className="swiper-button-prev !text-black !w-8 !h-8 after:!text-sm after:!font-bold"></div>
          <div className="swiper-button-next !text-black !w-8 !h-8 after:!text-sm after:!font-bold"></div>
        </div>
      </div>
    </section>
  );
}
