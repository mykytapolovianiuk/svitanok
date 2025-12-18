import { useSiteSetting } from '@/hooks/useSiteSettings';

export default function About() {
  const phone = useSiteSetting('phone', '+380 99 378 60 36');
  
  return (
    <div className="min-h-screen bg-[#F5F1EA]">
      {/* Hero Section with Beige Background */}
      <div className="bg-[rgba(255,200,140,0.4)] py-8">
        <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
          {/* Breadcrumbs */}
          <div className="text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            головна &gt; про нас
          </div>
          
          {/* Page Title */}
          <h1 
            className="text-3xl md:text-4xl font-medium uppercase tracking-[0.2em] text-center mb-2"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Про нас
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px] py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Section */}
            <div className="bg-white p-6 md:p-8">
              <h2 
                className="text-2xl md:text-3xl font-medium uppercase tracking-[0.1em] mb-6"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Вітаємо Вас в магазині Svitanok
              </h2>

              <ul className="space-y-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <li className="flex items-start">
                  <span className="text-black mr-3 font-light">•</span>
                  <span className="text-black font-light">Найвигідніші ціни по всій Україні</span>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 font-light">•</span>
                  <span className="text-black font-light">Тільки сертифіковані засоби для шкіри обличчя та тіла</span>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 font-light">•</span>
                  <span className="text-black font-light">Доставка Вашого замовлення на наступний день</span>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 font-light">•</span>
                  <span className="text-black font-light">Підтримка 24/7</span>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 font-light">•</span>
                  <span className="text-black font-light">Безкоштовна консультація з професійним косметологом</span>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 font-light">•</span>
                  <span className="text-black font-light">
                    Моментально відповімо на Ваші питання за номером{' '}
                    <a href="tel:+380993786036" className="hover:underline">
                      {phone}
                    </a>
                  </span>
                </li>
              </ul>
            </div>

            {/* Company Information */}
            <div className="bg-white p-6 md:p-8">
              <h3 
                className="text-xl md:text-2xl font-medium uppercase tracking-[0.1em] mb-6"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Інформація про компанію
              </h3>
              
              <div className="space-y-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <div className="flex flex-col md:flex-row">
                  <span className="font-medium w-full md:w-64 mb-1 md:mb-0">Назва:</span>
                  <span className="font-light">Svitanok</span>
                </div>
                <div className="flex flex-col md:flex-row">
                  <span className="font-medium w-full md:w-64 mb-1 md:mb-0">Тип компанії:</span>
                  <span className="font-light">Дистриб'ютор / Реселер</span>
                </div>
                <div className="flex flex-col md:flex-row">
                  <span className="font-medium w-full md:w-64 mb-1 md:mb-0">Кількість співробітників:</span>
                  <span className="font-light">5-10 осіб</span>
                </div>
              </div>
            </div>

            {/* Legal Form */}
            <div className="bg-white p-6 md:p-8">
              <h3 
                className="text-xl md:text-2xl font-medium uppercase tracking-[0.1em] mb-6"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Організаційно-правова форма та капітал
              </h3>
              
              <div className="space-y-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <div className="flex flex-col md:flex-row">
                  <span className="font-medium w-full md:w-64 mb-1 md:mb-0">Організаційно-правова форма:</span>
                  <span className="font-light">Приватне підприємство</span>
                </div>
              </div>
            </div>
            
            {/* Bank Details */}
            <div className="bg-white p-6 md:p-8">
              <h3 
                className="text-xl md:text-2xl font-medium uppercase tracking-[0.1em] mb-6"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Оплата на рахунок
              </h3>
              
              <div className="space-y-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <div className="flex flex-col">
                  <span className="font-medium mb-1">ФОП Кулинич А.М.</span>
                  <span className="font-light">4035200042250149</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium mb-1">ФОП Кулинич В.О.</span>
                  <span className="font-light">5169335102586829</span>
                </div>
                <div className="flex flex-col mt-4">
                  <span className="font-medium mb-1">Призначення платежу:</span>
                  <span className="font-light">оплата за товар</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Hours (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Working Hours */}
            <div className="bg-white p-6 md:p-8">
              <h3 
                className="text-lg md:text-xl font-medium uppercase tracking-[0.1em] mb-4"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Графік роботи:
              </h3>
              <p 
                className="font-light"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Понеділок - Неділя: 09:00 - 19:00
              </p>
            </div>

            {/* Contacts */}
            <div className="bg-white p-6 md:p-8">
              <h3 
                className="text-lg md:text-xl font-medium uppercase tracking-[0.1em] mb-4"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Контакти
              </h3>
              <div className="space-y-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <div>
                  <span className="font-medium block mb-1">Компанія:</span>
                  <span className="font-light">Svitanok</span>
                </div>
                <div>
                  <span className="font-medium block mb-1">Контактна особа:</span>
                  <span className="font-light">Володимир Кац</span>
                </div>
                <div>
                  <span className="font-medium block mb-1">Телефони:</span>
                  <span className="font-light">
                    <a href="tel:+380993786036" className="hover:underline">
                      {phone}
                    </a> (Менеджер)
                  </span>
                </div>
                <div>
                  <span className="font-medium block mb-1">Email:</span>
                  <a 
                    href="mailto:svitanok@gmail.com" 
                    className="font-light hover:underline"
                  >
                    svitanok@gmail.com
                  </a>
                </div>
                <div>
                  <span className="font-medium block mb-1">Адреса:</span>
                  <span className="font-light">м. Київ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}