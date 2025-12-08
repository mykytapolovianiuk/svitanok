import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const benefits = [
  {
    id: '1',
    leftColumn: [
      { title: 'РЕКОМЕНДОВАНО', subtitle: 'ДЕРМАТОЛОГАМИ' },
      { title: 'ПІДТВЕРДЖЕНІ', subtitle: 'РЕЗУЛЬТАТИ\nБОРОТЬБИ ЗІ СТАРІННЯМ' },
      { title: 'СЕРТИФІКОВАНО', subtitle: 'B CORP' },
    ],
    rightColumn: [
      { title: 'ПІДТВЕРДЖЕНО', subtitle: 'КЛІНІЧНИМИ\nТЕСТУВАННЯМИ' },
      { title: 'ВИРОБЛЕНО', subtitle: 'B UA' },
    ],
  },
];

export default function BenefitsSlider() {
  return (
    <section className="bg-[#FFF2E1] py-8 md:py-12 lg:py-16">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={24}
          slidesPerView={1}
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
          loop={true}
          className="benefits-swiper"
        >
          {benefits.map((benefit) => (
            <SwiperSlide key={benefit.id}>
              <div className="bg-[#FFF2E1] p-8 md:p-12 lg:p-16">
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
                  {/* Left Column */}
                  <div className="space-y-6 md:space-y-8">
                    {benefit.leftColumn.map((item, index) => (
                      <div key={index}>
                        <h3
                          className="text-lg md:text-xl lg:text-2xl font-bold mb-2 uppercase tracking-wide"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {item.title}
                        </h3>
                        <p
                          className="text-sm md:text-base lg:text-lg font-light whitespace-pre-line"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Vertical Divider */}
                  <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-black"></div>

                  {/* Right Column */}
                  <div className="space-y-6 md:space-y-8">
                    {benefit.rightColumn.map((item, index) => (
                      <div key={index}>
                        <h3
                          className="text-lg md:text-xl lg:text-2xl font-bold mb-2 uppercase tracking-wide"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {item.title}
                        </h3>
                        <p
                          className="text-sm md:text-base lg:text-lg font-light whitespace-pre-line"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}