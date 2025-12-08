export default function AboutSection() {
  return (
    <section className="py-8 md:py-12 lg:py-16 bg-[#FFF2E1]">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        <div className="max-w-3xl mx-auto">
          <h2 
            className="text-xl md:text-2xl lg:text-3xl font-medium uppercase tracking-[0.2em] mb-4 md:mb-6 text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Про бренд Svitanok
          </h2>
          <div className="space-y-4 md:space-y-6">
            <p 
              className="text-gray-700 font-light text-sm md:text-base leading-relaxed"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Svitanok — це не просто магазин, а справжній провідник у світ професійного 
              догляду за шкірою. Ми обираємо лише найякісніші косметичні засоби від провідних 
              світових брендів, які довели свою ефективність у боротьбі з різними проблемами шкіри.
            </p>
            <p 
              className="text-gray-700 font-light text-sm md:text-base leading-relaxed"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Наша місія — зробити професійну косметику доступною для кожної жінки в Україні. 
              Ми працюємо безпосередньо з офіційними дистриб'юторами, щоб гарантувати 
              автентичність продукції та найвигідніші ціни.
            </p>
            <p 
              className="text-gray-700 font-light text-sm md:text-base leading-relaxed"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Кожен товар у нашому каталозі супроводжується детальним описом та рекомендаціями 
              щодо застосування. Наші косметологи завжди готові надати безкоштовну консультацію 
              для підбору ідеального догляду саме для вашої шкіри.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}