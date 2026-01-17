import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import { Link } from 'react-router-dom';

// 👇 1. Переконайтесь, що стилі імпортовані (можна видалити, якщо вони є в main.tsx)
import 'swiper/css';
import 'swiper/css/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

const categories: Category[] = [
  {
    id: '1',
    name: 'СИРОВАТКИ',
    slug: 'serums',
    image: '/images/categories/01.png',
  },
  {
    id: '2',
    name: 'КРЕМИ',
    slug: 'creams',
    image: '/images/categories/02.png',
  },
  {
    id: '3',
    name: 'СОНЦЕЗАХИСТ',
    slug: 'sontsezahist-136846292',
    image: '/images/categories/03.png',
  },
  {
    id: '4',
    name: 'ОЧИЩЕННЯ',
    slug: 'vmivannya-ta-ochischennya-oblichchya-121050305',
    image: '/images/categories/04.png',
  },
  {
    id: '5',
    name: 'МАСКИ',
    slug: 'masks',
    image: '/images/categories/06.png',
  },
];

export default function CategorySlider() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        {/* Section Title */}
        <h2 
          className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-center text-text-main mb-5 md:mb-8 lg:mb-12 uppercase tracking-[0.2em]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Оберіть категорію
        </h2>

        {/* Swiper Slider */}
        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={24}
          slidesPerView="auto"
          
          // 👇 Цей параметр центрує слайди, якщо їх мало і вони не займають весь екран
          centerInsufficientSlides={true}
          
          // 👇 Цей параметр ВИМИКАЄ слайдер (блокує свайпи), якщо всі слайди вмістились
          watchOverflow={true} 
          
          loop={false}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            768: {
              // На десктопі забороняємо тягати мишкою, якщо слайдів мало
              allowTouchMove: false, 
            },
          }}
          className="category-slider mx-auto"
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id} className="min-w-[160px] md:min-w-[180px] max-w-[180px]">
              <Link
                to={`/catalog?category=${encodeURIComponent(category.slug)}`}
                className="block group cursor-pointer"
              >
                <div className="bg-primary rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105">
                  {/* Image Container */}
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                          
                  {/* Text Label */}
                  <div className="py-3 md:py-4 text-center">
                    <h3 
                      className="text-xs md:text-sm font-medium text-text-main uppercase tracking-wide"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}