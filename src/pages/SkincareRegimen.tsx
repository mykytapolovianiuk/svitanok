export default function SkincareRegimen() {
  return (
    <div className="min-h-screen bg-[#FFF2E1]">
      {/* Hero Section with Beige Background */}
      <div className="bg-[rgba(255,200,140,0.4)] py-8">
        <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
          {/* Breadcrumbs */}
          <div className="text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            головна &gt; режим догляду за шкірою
          </div>
          
          {/* Page Title */}
          <h1 className="text-3xl md:text-4xl font-medium uppercase tracking-[0.2em] text-center mb-2">
            Режим догляду за шкірою
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px] py-12">
        <div className="bg-white rounded-none border border-black p-6 md:p-8">
          <div className="prose max-w-none" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <h2 className="text-2xl font-medium uppercase tracking-[0.1em] mb-6">
              Створіть ідеальний режим догляду
            </h2>
            
            <p className="text-gray-700 mb-6 font-light leading-relaxed">
              Правильний режим догляду за шкірою - це основа здорової та сяючої шкіри. 
              Незалежно від типу вашої шкіри, послідовність та правильний підбір продуктів 
              мають вирішальне значення.
            </p>

            <h3 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 mt-8">
              Базовий режим догляду (день та вечір)
            </h3>
            
            <div className="space-y-6 mb-8">
              <div className="border-l-4 border-black pl-4">
                <h4 className="font-semibold mb-2 uppercase">Ранковий догляд</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 font-light">
                  <li>Очищення - м'який гель або піна для вмивання</li>
                  <li>Тонер - для балансування pH та підготовки шкіри</li>
                  <li>Серум - з вітаміном C або антиоксидантами</li>
                  <li>Крем - легкий денний крем з SPF захистом</li>
                </ol>
              </div>
              
              <div className="border-l-4 border-black pl-4">
                <h4 className="font-semibold mb-2 uppercase">Вечірній догляд</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 font-light">
                  <li>Демакіяж - олія або міцелярна вода</li>
                  <li>Очищення - глибоке очищення для видалення залишків</li>
                  <li>Тонер - для відновлення балансу</li>
                  <li>Серум - з ретинолом або пептидами (2-3 рази на тиждень)</li>
                  <li>Крем - багатий нічний крем для відновлення</li>
                </ol>
              </div>
            </div>

            <h3 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 mt-8">
              Типи шкіри та особливості догляду
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="border border-gray-200 p-4">
                <h4 className="font-semibold mb-2 uppercase">Суха шкіра</h4>
                <p className="text-sm text-gray-700 font-light mb-2">
                  Потребує інтенсивного зволоження та захисту.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Багаті креми з церамідами</li>
                  <li>• Олійні серуми</li>
                  <li>• М'які очищувальні засоби</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 p-4">
                <h4 className="font-semibold mb-2 uppercase">Жирна шкіра</h4>
                <p className="text-sm text-gray-700 font-light mb-2">
                  Потребує контролю виділення себуму та очищення.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Легкі гелі та емульсії</li>
                  <li>• Продукти з саліциловою кислотою</li>
                  <li>• Не комедогенні формули</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 p-4">
                <h4 className="font-semibold mb-2 uppercase">Комбінована шкіра</h4>
                <p className="text-sm text-gray-700 font-light mb-2">
                  Потребує балансу між зволоженням та контролем жирності.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Багатофункціональні продукти</li>
                  <li>• Зональний догляд</li>
                  <li>• Легкі текстури</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 p-4">
                <h4 className="font-semibold mb-2 uppercase">Чутлива шкіра</h4>
                <p className="text-sm text-gray-700 font-light mb-2">
                  Потребує м'яких, гіпоалергенних продуктів.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Мінімальна кількість інгредієнтів</li>
                  <li>• Без парфумів та барвників</li>
                  <li>• Успішні та заспокійливі компоненти</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-medium uppercase tracking-[0.1em] mb-4 mt-8">
              Додаткові процедури
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 border border-gray-200">
                <h4 className="font-semibold mb-2 text-sm uppercase">Ексфоліація</h4>
                <p className="text-xs text-gray-600 font-light">
                  1-2 рази на тиждень для видалення мертвих клітин
                </p>
              </div>
              
              <div className="text-center p-4 border border-gray-200">
                <h4 className="font-semibold mb-2 text-sm uppercase">Маски</h4>
                <p className="text-xs text-gray-600 font-light">
                  1-2 рази на тиждень для інтенсивного догляду
                </p>
              </div>
              
              <div className="text-center p-4 border border-gray-200">
                <h4 className="font-semibold mb-2 text-sm uppercase">SPF захист</h4>
                <p className="text-xs text-gray-600 font-light">
                  Щодня, навіть в похмурі дні
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 border border-gray-200">
              <h4 className="font-semibold mb-3 uppercase">Індивідуальна консультація</h4>
              <p className="text-gray-700 font-light leading-relaxed mb-4">
                Кожна шкіра унікальна. Наші косметологи допоможуть вам створити ідеальний 
                режим догляду, враховуючи ваш тип шкіри, вік та особливі потреби.
              </p>
              <a 
                href="/contacts" 
                className="inline-block px-6 py-2 bg-black text-white uppercase text-sm hover:opacity-90 transition"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Зв'язатися з нами
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



