import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/catalog/ProductCard';
import { useProductReviews } from '@/hooks/useProductReviews';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  images: string[];
  attributes: Record<string, any>;
  description: string;
}

// Component for products with real rating
function ProductCardWithRating({ product }: { product: Product }) {
  const { data: reviewStats } = useProductReviews(product.id);
  const rating = reviewStats?.averageRating || 0;
  
  return (
    <ProductCard
      id={product.id}
      name={product.name}
      slug={product.slug}
      price={product.price}
      oldPrice={product.old_price}
      image={product.images[0] || ''}
      rating={rating}
      description={product.description}
    />
  );
}

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<'bestsellers' | 'new'>('bestsellers');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*').eq('in_stock', true);

      if (activeTab === 'new') {
        query = query.order('created_at', { ascending: false }).limit(8);
      } else {
        query = query.limit(8);
      }
      
      query = query.select('id, name, slug, price, old_price, images, attributes, description');

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Помилка завантаження товарів:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-[#FAF4EB]">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="inline-flex bg-gray-100 rounded-none p-0.5 md:p-1">
            <button
              className={`px-4 md:px-6 py-2 md:py-3 font-medium uppercase tracking-widest text-xs md:text-sm transition-colors ${
                activeTab === 'bestsellers'
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
              onClick={() => setActiveTab('bestsellers')}
            >
              Хіти продажу
            </button>
            <button
              className={`px-4 md:px-6 py-2 md:py-3 font-medium uppercase tracking-widest text-xs md:text-sm transition-colors ${
                activeTab === 'new'
                  ? 'bg-black text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
              onClick={() => setActiveTab('new')}
            >
              Новинки
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8 md:py-12">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={16}
            slidesPerView={2}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet !bg-black',
              bulletActiveClass: 'swiper-pagination-bullet-active !bg-black',
            }}
            navigation={true}
            loop={products.length > 4}
            className="product-showcase-swiper"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCardWithRating product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}