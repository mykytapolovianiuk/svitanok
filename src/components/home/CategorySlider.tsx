import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import { Link } from 'react-router-dom';

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
    slug: 'sunscreen',
    image: '/images/categories/03.png',
  },
  {
    id: '4',
    name: 'ОЧИЩЕННЯ',
    slug: 'cleansing',
    image: '/images/categories/04.png',
  },
  {
    id: '5',
    name: 'КИСЛОТИ',
    slug: 'acids',
    image: '/images/categories/05.png',
  },
  {
    id: '6',
    name: 'МАСКИ',
    slug: 'masks',
    image: '/images/categories/06.png',
  },
];

export default function CategorySlider() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        {}
        <h2 
          className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-center text-text-main mb-6 md:mb-8 lg:mb-12 uppercase tracking-[0.2em]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Оберіть категорію
        </h2>

        {}
        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={20}
          slidesPerView={2}
          loop={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            480: {
              slidesPerView: 3,
              spaceBetween: 16,
            },
            640: {
              slidesPerView: 4,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 5,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 6,
              spaceBetween: 24,
            },
          }}
          className="category-slider"
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id}>
              <Link
                to={`/catalog/${category.slug}`}
                className="block group cursor-pointer"
              >
                <div className="bg-primary rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105">
                  {}
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  {}
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
