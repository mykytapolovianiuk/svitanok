import { RefreshCw, Shield, MapPin } from 'lucide-react';

export default function Returns() {
  return (
    <div className="min-h-screen bg-[#FFF2E1] py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {}
        <div className="text-center mb-12 sm:mb-16">
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-4 uppercase tracking-[2px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Обмін та повернення
          </h1>
        </div>

        {}
        <div className="bg-white rounded-none border border-black p-6 sm:p-8">
          <div className="prose prose-gray max-w-none">
            <div className="flex items-start gap-4 mb-8">
              <Shield className="h-6 w-6 text-gray-900 mt-1 flex-shrink-0" />
              <p 
                className="text-gray-700 text-base sm:text-lg leading-relaxed"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Згідно Закону України "Про захист прав споживачів" №1023-XII від 12.05.1991, парфумно-косметичні товари входять до переліку непродовольчих товарів належної якості, що не підлягають поверненню або обміну.
              </p>
            </div>

            <div className="flex items-start gap-4 mb-8">
              <RefreshCw className="h-6 w-6 text-gray-900 mt-1 flex-shrink-0" />
              <p 
                className="text-gray-700 text-base sm:text-lg leading-relaxed"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Доставляємо до Вас засоби та препарати з повною відповідністю з описами та фото та прикладаємо максимум зусиль, щоб Ви отримали задоволення від отриманого замовлення. Але якщо до Вас надійшла неправильна позиція, або стався казус з провиною послуг доставки - моментально вирішимо усі незручності із заміною засобу, при умові фото- та відеофіксації ушкодження.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-gray-900 mt-1 flex-shrink-0" />
              <div>
                <p 
                  className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Зворотня доставка оформлюється за адресою:
                </p>
                <p 
                  className="text-gray-900 text-lg font-medium"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  м. Київ, вулиця Січових стрільців, 14
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}