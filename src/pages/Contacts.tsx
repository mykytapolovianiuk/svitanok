import { useSiteSetting } from '@/hooks/useSiteSettings';

export default function Contacts() {
  const phone = useSiteSetting('phone', '+380 99 378 60 36');
  const email = useSiteSetting('email', 'svitanok@gmail.com');
  
  return (
    <div className="min-h-screen bg-[#F5F1EA]">
      {}
      <div className="bg-[rgba(255,200,140,0.4)] py-8">
        <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
          {}
          <div className="text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            головна &gt; контакти
          </div>
          
          {}
          <h1 
            className="text-3xl md:text-4xl font-medium uppercase tracking-[0.2em] text-center mb-2"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Контакти
          </h1>
        </div>
      </div>

      {}
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px] py-12">
        <div className="bg-white p-6 md:p-8">
          {}
          <h2 
            className="text-2xl md:text-3xl font-medium uppercase tracking-[0.1em] mb-6"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Турбуємось про покупців Svitanok
          </h2>
          
          {}
          <p 
            className="text-gray-700 mb-6 font-light leading-relaxed" 
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Ми робимо все можливе, щоб забезпечити наших клієнтів найвищою якістю продуктів (Medik8) та обслуговування в Україні. 
            Якщо у вас є пропозиції, коментарі або вам потрібна допомога з вибором салону або клініки краси, 
            будь ласка, напишіть або зателефонуйте нам.
          </p>
          
          {}
          <p 
            className="text-gray-700 mb-8 font-light" 
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Графік роботи підтримки: щодня з 9.00 до 20.00
          </p>
          
          {}
          <div className="space-y-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div>
              <h3 className="font-medium mb-2">Телефон:</h3>
              <p className="font-light text-gray-700">
                <a href="tel:+380993786036" className="hover:underline">
                  {phone}
                </a>
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">З медіа питань:</h3>
              <a 
                href="mailto:marketing@svitanok.com" 
                className="font-light text-gray-700 hover:underline"
              >
                marketing@svitanok.com
              </a>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">З питань співпраці:</h3>
              <p className="font-light text-gray-700">
                <a href="tel:+380993786036" className="hover:underline">
                  {phone}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}