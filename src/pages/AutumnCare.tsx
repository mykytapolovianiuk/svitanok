export default function AutumnCare() {
  return (
    <div className="min-h-screen bg-[#FFF2E1]">
      {/* Hero Section with Beige Background */}
      <div className="bg-[rgba(255,200,140,0.4)] py-8">
        <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
          {/* Breadcrumbs */}
          <div className="text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            головна &gt; осінній догляд
          </div>
          
          {/* Page Title */}
          <h1 className="text-3xl md:text-4xl font-medium uppercase tracking-[0.2em] text-center mb-2">
            Осінній догляд
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px] py-12">
        <div className="bg-white rounded-none border border-black p-6 md:p-8">
          <div className="prose max-w-none" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <h2 className="text-2xl font-medium uppercase tracking-[0.1em] mb-6">
              Особливості осіннього догляду за шкірою
            </h2>
            
            <p className="text-gray-700 mb-6 font-light leading-relaxed">
              Осінь - це час змін не тільки в природі, але й у потребі вашої шкіри. 
              Зниження температури, зміна вологості повітря та менша кількість сонячного світла 
              вимагають особливого підходу до догляду.
            </p>

            <h3 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 mt-8">
              Чому важливий осінній догляд?
            </h3>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <span className="text-black mr-2">•</span>
                <span className="text-black font-light">
                  <strong>Зміна температури:</strong> Різкі перепади між теплом приміщень та холодом на вулиці 
                  можуть призвести до сухості та подразнення шкіри.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-black mr-2">•</span>
                <span className="text-black font-light">
                  <strong>Зниження вологості:</strong> Центральне опалення сушить повітря, що може викликати 
                  відчуття стягнутості та лущення.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-black mr-2">•</span>
                <span className="text-black font-light">
                  <strong>Відновлення після літа:</strong> Осінь - ідеальний час для відновлення шкіри 
                  після впливу сонця та відновлення гідратації.
                </span>
              </li>
            </ul>

            <h3 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 mt-8">
              Рекомендації для осіннього догляду
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="border border-gray-200 p-4">
                <h4 className="font-semibold mb-2 uppercase">Інтенсивне зволоження</h4>
                <p className="text-sm text-gray-700 font-light">
                  Використовуйте багатші креми та серуми з гіалуроновою кислотою для відновлення 
                  гідратації шкіри.
                </p>
              </div>
              
              <div className="border border-gray-200 p-4">
                <h4 className="font-semibold mb-2 uppercase">Захист від впливу навколишнього середовища</h4>
                <p className="text-sm text-gray-700 font-light">
                  Навіть восени важливо використовувати SPF захист, особливо в сонячні дні.
                </p>
              </div>
              
              <div className="border border-gray-200 p-4">
                <h4 className="font-semibold mb-2 uppercase">Відновлення та регенерація</h4>
                <p className="text-sm text-gray-700 font-light">
                  Додайте продукти з ретинолом або пептидами для покращення текстури та тону шкіри.
                </p>
              </div>
              
              <div className="border border-gray-200 p-4">
                <h4 className="font-semibold mb-2 uppercase">М'яке очищення</h4>
                <p className="text-sm text-gray-700 font-light">
                  Використовуйте м'які очищувальні засоби, які не пересишують шкіру.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 border border-gray-200">
              <h4 className="font-semibold mb-3 uppercase">Порада від експертів Svitanok</h4>
              <p className="text-gray-700 font-light leading-relaxed">
                Осінь - ідеальний час для початку курсу професійного догляду. Зверніться до наших 
                косметологів для індивідуальної консультації та підбору оптимального режиму догляду 
                для вашої шкіри.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



