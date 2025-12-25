import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';

import 'swiper/css/navigation';

import 'swiper/css/pagination';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useCartStore } from '@/store/cartStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useProductReviews } from '@/hooks/useProductReviews';
import { toast } from 'react-hot-toast';
import { formatPrice } from '@/utils/helpers';

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
}

interface RecommendedProductsProps {
  products: Product[];
  loading: boolean;
}

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
        {}
        <div className="relative bg-[#F5F5F5] aspect-[3/4] overflow-hidden">
          {}
          {discountPercent > 0 && (
            <div className="absolute top-2 left-2 z-10 bg-black text-white px-2 py-1 text-xs font-bold uppercase">
              ЗНИЖКА {discountPercent}%
            </div>
          )}
          
          {}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 hover:bg-white transition-colors"
          >
            <Heart
              size={16}
              className={`${isFavorite(product.id) ? 'fill-black stroke-black' : 'stroke-black'}`}
            />
          </button>

          {}
          <img
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {}
        <div className="p-4 flex-1 flex flex-col">
          {}
          <h3
            className="text-sm font-medium uppercase text-center underline underline-offset-4 mb-2 line-clamp-2 min-h-[40px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {product.name}
          </h3>

          {}
          {product.description && (
            <p className="text-[10px] text-gray-500 text-center line-clamp-2 mb-3 min-h-[30px]">
              {product.description}
            </p>
          )}

          {}
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

          {}
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

      {}
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

export default function RecommendedProducts({ products, loading }: RecommendedProductsProps) {
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

  if (products.length === 0) {
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
        
        {}
        <div className="hidden md:grid md:grid-cols-3 gap-6 mb-8">
          {products.map((product) => (
            <div key={product.id} className="h-full">
              <RecommendedProductCard product={product} />
            </div>
          ))}
        </div>
        
        {}
        <div className="md:hidden">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={2}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 2,
                spaceBetween: 24,
              },
            }}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet !bg-black',
              bulletActiveClass: 'swiper-pagination-bullet-active !bg-black',
            }}
            navigation={true}
            loop={products.length > 2}
            className="recommended-products-swiper"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <RecommendedProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}