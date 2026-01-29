import { Truck, Wallet, CreditCard, Building, User, MapPin } from 'lucide-react';

export default function Delivery() {
  return (
    <div className="min-h-screen bg-[#FFF2E1] py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-4 uppercase tracking-[2px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Оплата і доставка
          </h1>
          <p
            className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Зручні способи доставки та оплати ваших замовлень
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Delivery Methods */}
          <div className="bg-white rounded-none border border-black p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Truck className="h-6 w-6 text-gray-900" />
              <h2
                className="text-xl sm:text-2xl font-medium text-gray-900 uppercase tracking-[1px]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Способи доставки
              </h2>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4 hidden">
                {/* Ukrposhta removed */}
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="font-medium text-gray-900 mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Самовивіз (Безкоштовно)
                  </h3>
                  <p
                    className="text-gray-600 text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    м. Київ, вулиця Січових стрільців, 14
                  </p>
                  <p
                    className="text-gray-500 text-xs mt-1 italic"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Перед візитом, просимо Вас зателефонувати, щоб отримати актуальну інформацію перед отриманням
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <User className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="font-medium text-gray-900 mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Доставка кур'єром
                  </h3>
                  <p
                    className="text-gray-600 text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    До дверей у вашому місті
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Truck className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="font-medium text-gray-900 mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Нова Пошта
                  </h3>
                  <p
                    className="text-gray-600 text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    За тарифами перевізника
                  </p>
                  <p
                    className="text-gray-600 text-sm mt-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    БЕЗКОШТОВНА за умови вартості замовлення від 4000 ₴
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-none border border-black p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="h-6 w-6 text-gray-900" />
              <h2
                className="text-xl sm:text-2xl font-medium text-gray-900 uppercase tracking-[1px]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Способи оплати
              </h2>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <CreditCard className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="font-medium text-gray-900 mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Apple Pay / Google Pay
                  </h3>
                  <p
                    className="text-gray-600 text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Швидка та безпечна оплата зі смартфону
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CreditCard className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="font-medium text-gray-900 mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Післяплата
                  </h3>
                  <p
                    className="text-gray-600 text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Оплата при отриманні замовлення
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CreditCard className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="font-medium text-gray-900 mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Оплата частинами
                  </h3>
                  <p
                    className="text-gray-600 text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Приватбанк, Монобанк
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CreditCard className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="font-medium text-gray-900 mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Оплата карткою Visa/Mastercard
                  </h3>
                  <p
                    className="text-gray-600 text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Через систему Liqpay
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Wallet className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="font-medium text-gray-900 mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Готівкою
                  </h3>
                  <p
                    className="text-gray-600 text-sm"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    При самовивозі з нашого офісу
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Building className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="font-medium text-gray-900 mb-1"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Оплата на рахунок
                  </h3>
                  <div className="text-gray-600 text-sm space-y-1">
                    <p>4035200042250149 ФОП Кулинич А.М.</p>
                    <p>5169335102586829 ФОП Кулинич В.О.</p>
                    <p className="mt-2">Призначення платежу: оплата за товар</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}