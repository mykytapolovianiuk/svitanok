import SEOHead from '@/components/seo/SEOHead';

export default function TermsOfService() {
  return (
    <>
      <div className="bg-[rgba(255,200,140,0.4)] py-8">
        <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
          <div className="text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            головна &gt; умови використання
          </div>
          
          <h1 
            className="text-3xl md:text-4xl font-medium uppercase tracking-[0.2em] text-center mb-2"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Умови використання
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-[1440px] py-12">
        <div className="bg-white p-6 md:p-8">
          <div className="prose prose-lg max-w-none">
            <section>
              <h1 className="font-semibold mb-4 text-xl">Умови використання</h1>
              <p className="mb-4">
                Ці Умови використання регулюють ваш доступ до та використання веб-сайту Svitanok 
                (разом іменовані "Сервіс").
              </p>
            </section>

            <section>
              <h2 className="font-semibold mb-3 text-lg">1. Прийняття умов</h2>
              <p className="mb-3">
                Завантажуючи, переглядаючи або іншим чином використовуючи цей сайт, ви погоджуєтесь 
                дотримуватися цих Умов використання. Якщо ви не згодні з усіма цими умовами, 
                не використовуйте сайт.
              </p>
            </section>

            <section>
              <h2 className="font-semibold mb-3 text-lg">2. Зміни в умовах</h2>
              <p className="mb-3">
                Ми залишаємо за собою право змінювати ці Умови використання в будь-який час. 
                Зміни вступають в силу з моменту їх публікації на сайті. Продовжуючи використовувати 
                сайт після публікації змін, ви погоджуєтесь дотримуватися змінених умов.
              </p>
            </section>

            <section>
              <h2 className="font-semibold mb-3 text-lg">3. Реєстрація та обліковий запис</h2>
              <p className="mb-3">
                Для доступу до деяких функцій сайту може знадобитися реєстрація. Ви зобов'язуєтесь 
                надавати точну, актуальну та повну інформацію під час реєстрації та підтримувати 
                цю інформацію в актуальному стані.
              </p>
              <p className="mb-3">
                Ви несете відповідальність за збереження конфіденційності пароля та облікового запису 
                та за всі дії, які здійснюються з вашого облікового запису.
              </p>
            </section>

            <section>
              <h2 className="font-semibold mb-3 text-lg">4. Інтелектуальна власність</h2>
              <p className="mb-3">
                Весь контент, функції та функціональність сайту (включаючи, але не обмежуючись, 
                текст, графіку, логотипи, іконки, зображення, аудіо, відео, програмне забезпечення, 
                дизайн та вибір і розташування всіх матеріалів) є власністю Svitanok або її ліцензіарів 
                та захищені авторським правом, торговельними марками та іншими законами про інтелектуальну власність.
              </p>
            </section>

            <section>
              <h2 className="font-semibold mb-3 text-lg">5. Обмеження використання</h2>
              <p className="mb-3">
                Ви зобов'язуєтесь не використовувати сайт для:
              </p>
              <ul className="list-disc pl-5 mb-3 space-y-1">
                <li>Будь-якої незаконної мети</li>
                <li>Передачі будь-якого матеріалу, який є незаконним, шкідливим, загрозливим, образливим, дискримінуючим</li>
                <li>Порушення прав інших осіб</li>
                <li>Завдання шкоди або спроби завдати шкоди сайтам або мережам, пов'язаним з сайтом</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold mb-3 text-lg">6. Замовлення та оплата</h2>
              <p className="mb-3">
                При оформленні замовлення ви зобов'язуєтесь надати точну інформацію про себе 
                та платникові реквізити. Ми залишаємо за собою право скасувати будь-яке замовлення 
                за власним розсудом.
              </p>
              <p className="mb-3">
                Всі ціни вказані в гривнях. Оплата здійснюється в момент оформлення замовлення 
                через доступні платіжні системи.
              </p>
            </section>

            <section>
              <h2 className="font-semibold mb-3 text-lg">7. Доставка</h2>
              <p className="mb-3">
                Ми здійснюємо доставку по всій Україні через служби доставки. Терміни доставки 
                залежать від обраної служби доставки та місця призначення.
              </p>
              <p className="mb-3">
                Вартість доставки залежить від суми замовлення та обраної служби доставки.
              </p>
            </section>

            <section>
              <h2 className="font-semibold mb-3 text-lg">8. Контактна інформація</h2>
              <p>
                З усіх питань звертайтесь: 
                <a href="mailto:svitanok@gmail.com" className="underline ml-1">svitanok@gmail.com</a>
              </p>
            </section>

            <section>
              <p className="text-xs text-gray-600 mt-8">
                Останнє оновлення: {new Date().toLocaleDateString('uk-UA')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
