import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
// @ts-ignore
import 'swiper/css';
// @ts-ignore
import 'swiper/css/pagination';
// @ts-ignore
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
  images: string[] | null;
  attributes: Record<string, any>;
  description: string;
  is_bestseller?: boolean;
}

// Component for products with real rating
function ProductCardWithRating({ product }: { product: Product }) {
  const { data: reviewStats } = useProductReviews(product.id);
  const rating = reviewStats?.averageRating || 0;
  
  // Safely handle images array
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0] 
    : '/placeholder-product.jpg';
  
  return (
    <ProductCard
      id={product.id}
      name={product.name}
      slug={product.slug}
      price={product.price}
      oldPrice={product.old_price}
      image={imageUrl}
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
      let data: Product[] = [];

      if (activeTab === 'bestsellers') {
        // Fetch manually selected bestsellers
        const { data: bestsellersData, error: bestsellersError } = await supabase
          .from('products')
          .select('id, name, slug, price, old_price, images, attributes, description, is_bestseller')
          .eq('in_stock', true)
          .eq('is_bestseller', true)
          .limit(8);
        
        if (bestsellersError) throw bestsellersError;
        data = bestsellersData || [];
      } else {
        // Fetch new arrivals based on creation date
        const { data: newData, error: newError } = await supabase
          .from('products')
          .select('id, name, slug, price, old_price, images, attributes, description, is_bestseller')
          .eq('in_stock', true)
          .order('created_at', { ascending: false })
          .limit(8);
          
        if (newError) throw newError;
        data = newData || [];
      }

      setProducts(data);
    } catch (error) {
      console.error('Помилка завантаження товарів:', error);
      setProducts([]);
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
            navigation={{
              nextEl: '.product-showcase-swiper .swiper-button-next',
              prevEl: '.product-showcase-swiper .swiper-button-prev',
            }}
            loop={products.length > 4}
            className="product-showcase-swiper relative pb-12"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCardWithRating product={product} />
              </SwiperSlide>
            ))}
            <div className="swiper-button-next !text-black !w-10 !h-10 after:!text-lg after:!font-bold !hidden md:!block !top-[calc(100%-60px)] !-right-8 !bg-white !rounded-full !shadow-lg !border !border-gray-200"></div>
            <div className="swiper-button-prev !text-black !w-10 !h-10 after:!text-lg after:!font-bold !hidden md:!block !top-[calc(100%-60px)] !-left-8 !bg-white !rounded-full !shadow-lg !border !border-gray-200"></div>
          </Swiper>
        )}
      </div>
    </section>
  );
}