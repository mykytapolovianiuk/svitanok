import { ShieldCheck, AlertTriangle, Info } from 'lucide-react';

export default function Returns() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-12 sm:mb-16">
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-4 uppercase tracking-[2px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Обмін та повернення
          </h1>
        </div>

        <div className="space-y-8">
          {}
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h2 
                  className="text-xl font-semibold text-gray-900 mb-3"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Загальні положення
                </h2>
                <p 
                  className="text-gray-700 text-base sm:text-lg leading-relaxed"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Відповідно до Закону «Про захист прав споживачів», компанія може відмовити в обміні та поверненні товарів належної якості, якщо вони входять до переліку непродовольчих товарів, що не підлягають поверненню та обміну.
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="bg-[#FFF2E1] rounded-lg border border-orange-200 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <h2 
                  className="text-xl font-semibold text-gray-900 mb-3"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Важлива інформація про косметику
                </h2>
                <p 
                  className="text-gray-800 text-base sm:text-lg leading-relaxed mb-3"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Згідно з українським законодавством, парфумерно-косметичні вироби належної якості не підлягають обміну або поверненню, тому що вони входять до спеціального переліку товарів, що заборонені для повернення (Постанова КМУ №172).
                </p>
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mt-4">
                  <p className="text-orange-700 text-sm">
                    <strong>Увага:</strong> Це вимога законодавства України. Ми не можемо приймати до повернення косметичні засоби належної якості.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <Info className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h2 
                  className="text-xl font-semibold text-gray-900 mb-3"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Повернення пошкоджених товарів
                </h2>
                <p 
                  className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Але у випадку порушення цілосності засобу при отриманні, швидко відправимо Вам новий засіб, при отриманні фото- або відеофіксації пошкодження на відділенні пошти.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    Для оформлення повернення пошкодженого товару необхідно надіслати нам фото/відео пошкодження протягом 24 годин після отримання.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p 
              className="text-gray-600 text-sm"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Джерело: <a href="https://data.gov.ua/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://data.gov.ua/</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}