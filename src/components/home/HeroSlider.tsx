import { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useBannerImpression } from '@/hooks/useAnalytics';
import { trackBannerClick } from '@/lib/analytics/dispatcher';

interface BannerSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonBg: string;
  buttonStroke: string;
  buttonTextColor: string;
  titleColor: string;
  subtitleColor: string;
}

const slides: BannerSlide[] = [
  {
    id: '1',
    image: '/images/banners/banner-01.jpg',
    title: 'Сімейний набір для ідеальної шкіри',
    subtitle: 'Усі необхідні засоби в одному комплекті. Купуйте разом вигідніше.',
    buttonText: 'ЗАМОВИТИ СЕТ',
    buttonBg: '#E35336',
    buttonStroke: '#000000',
    buttonTextColor: '#FFFFFF',
    titleColor: '#000000',
    subtitleColor: '#000000',
  },
  {
    id: '2',
    image: '/images/banners/banner-02.jpg',
    title: 'Обери потрібний догляд для своєї шкіри',
    subtitle: 'Понад 500 товарів від провідних світових брендів. Професійна косметика для кожного.',
    buttonText: 'ОБРАТИ ДОГЛЯД',
    buttonBg: '#000000',
    buttonStroke: '#000000',
    buttonTextColor: '#FFFFFF',
    titleColor: '#000000',
    subtitleColor: '#000000',
  },
  {
    id: '3',
    image: '/images/banners/banner-03.jpg',
    title: 'Знайдіть свій ідеальний догляд',
    subtitle: 'Природна сила та професійна турбота. Оберіть косметику, яка працює саме для вас.',
    buttonText: 'ЗІБРАТИ ВІШЛІСТ',
    buttonBg: '#FFFFFF',
    buttonStroke: '#000000',
    buttonTextColor: '#000000',
    titleColor: '#000000',
    subtitleColor: '#000000',
  },
  {
    id: '4',
    image: '/images/banners/banner-04.jpg',
    title: 'Швидка доставка по всій Україні',
    subtitle: 'Замовляйте зараз – отримуйте вже завтра. Безкоштовна доставка від 4000 грн.',
    buttonText: 'ЗАМОВИТИ ЗАРАЗ',
    buttonBg: '#E35336',
    buttonStroke: '#000000',
    buttonTextColor: '#FFFFFF',
    titleColor: '#000000',
    subtitleColor: '#000000',
  },
  {
    id: '5',
    image: '/images/banners/banner-05.jpg',
    title: 'Ваш шлях до ідеальної шкіри починається тут',
    subtitle: 'Досліджуйте наш каталог та оберіть професійні засоби, створені саме для ваших потреб.',
    buttonText: 'ВІДКРИТИ ДЛЯ СЕБЕ',
    buttonBg: '#FFFFFF',
    buttonStroke: '#000000',
    buttonTextColor: '#000000',
    titleColor: '#FFFFFF',
    subtitleColor: '#FFFFFF',
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const swiperRef = useRef<SwiperType | null>(null);

  const toggleAutoplay = () => {
    if (swiperRef.current) {
      if (isPlaying) {
        swiperRef.current.autoplay.stop();
      } else {
        swiperRef.current.autoplay.start();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const goNext = () => {
    swiperRef.current?.slideNext();
  };

  const goPrev = () => {
    swiperRef.current?.slidePrev();
  };

  return (
    <section className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px]">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        speed={1000}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => {
          setCurrentSlide(swiper.realIndex + 1);
        }}
        className="w-full h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <BannerSlide slide={slide} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Controls - Bottom Left */}
      <div className="absolute bottom-8 left-8 z-10 flex items-center gap-4">
        {/* Navigation Arrows */}
        <button
          onClick={goPrev}
          className="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} className="text-black" />
        </button>

        {/* Slide Counter */}
        <div className="bg-white/80 px-4 py-2 rounded-full">
          <span className="font-medium text-black" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {currentSlide} / {slides.length}
          </span>
        </div>

        <button
          onClick={goNext}
          className="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full transition-all"
          aria-label="Next slide"
        >
          <ChevronRight size={20} className="text-black" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-white/50" />

        {/* Play/Pause Button */}
        <button
          onClick={toggleAutoplay}
          className="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full transition-all"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={20} className="text-black" fill="black" />
          ) : (
            <Play size={20} className="text-black" fill="black" />
          )}
        </button>
      </div>
    </section>
  );
}

function BannerSlide({ slide }: { slide: BannerSlide }) {
  useBannerImpression(`hero-${slide.id}`, slide.title, 'hero', true);
  
  const handleBannerClick = () => {
    let targetUrl = '/catalog';
    
    switch(slide.id) {
      case '1':
        targetUrl = '/catalog';
        break;
      case '2':
        targetUrl = '/catalog';
        break;
      case '3':
        targetUrl = '/favorites';
        break;
      case '4':
        targetUrl = '/catalog';
        break;
      case '5':
        targetUrl = '/catalog';
        break;
      default:
        targetUrl = '/catalog';
    }
    
    trackBannerClick(`hero-${slide.id}`, slide.title, 'hero', targetUrl);
    window.location.href = targetUrl;
  };
  
  return (
    <div className="relative w-full h-full" id={`hero-${slide.id}`}>
      {/* Background Image */}
      <img
        src={slide.image}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            {/* Desktop Content */}
            <div className="hidden md:block">
              <h1
                className="font-semibold mb-6"
                style={{
                  fontSize: '48px',
                  lineHeight: '1.2',
                  color: slide.titleColor,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {slide.title}
              </h1>
              <p
                className="mb-8"
                style={{
                  fontSize: '20px',
                  lineHeight: '1.5',
                  color: slide.subtitleColor,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 400,
                }}
              >
                {slide.subtitle}
              </p>
              <button
                onClick={handleBannerClick}
                className="px-8 py-3 font-medium transition-all hover:opacity-90"
                style={{
                  backgroundColor: slide.buttonBg,
                  color: slide.buttonTextColor,
                  border: `2px solid ${slide.buttonStroke}`,
                  borderRadius: '5px',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {slide.buttonText}
              </button>
            </div>

            {/* Mobile Content */}
            <div className="md:hidden text-center">
              <h1
                className="font-semibold mb-4"
                style={{
                  fontSize: '24px',
                  lineHeight: '1.2',
                  color: slide.titleColor,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {slide.title}
              </h1>
              <p
                className="mb-6 text-sm"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.4',
                  color: slide.subtitleColor,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 400,
                }}
              >
                {slide.subtitle}
              </p>
              <button
                onClick={handleBannerClick}
                className="px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90"
                style={{
                  backgroundColor: slide.buttonBg,
                  color: slide.buttonTextColor,
                  border: `2px solid ${slide.buttonStroke}`,
                  borderRadius: '5px',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {slide.buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
