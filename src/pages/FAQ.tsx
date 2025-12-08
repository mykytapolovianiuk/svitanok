import { useState } from 'react';
import { Plus } from 'lucide-react';

interface FAQItem {
  id: string;
  title: string;
  content: string;
}

interface FAQCategory {
  id: string;
  title: string;
  items: FAQItem[];
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const faqCategories: FAQCategory[] = [
    {
      id: 'delivery',
      title: 'Доставка',
      items: [
        {
          id: 'delivery-1',
          title: 'Які способи доставки доступні?',
          content: 'Нова Пошта (відділення, кур\'єр) та Укрпошта.'
        },
        {
          id: 'delivery-2',
          title: 'Чи можна замовити доставку кур\'єром?',
          content: 'Так, ми надаємо послугу доставки кур\'єром "Нова Пошта" за додаткову плату.'
        },
        {
          id: 'delivery-3',
          title: 'Як я дізнаюся про відправку замовлення?',
          content: 'Після відправки замовлення ви отримаєте SMS та email з номером ТТН та посиланням для відстеження.'
        }
      ]
    },
    {
      id: 'payment',
      title: 'Оплата',
      items: [
        {
          id: 'payment-1',
          title: 'Які способи оплати ви приймаєте?',
          content: 'Ми приймаємо оплату онлайн через LiqPay (карткою Visa/Mastercard) або при отриманні товару (післяплата).'
        }
      ]
    },
    {
      id: 'returns',
      title: 'Повернення та обмін',
      items: [
        {
          id: 'returns-1',
          title: 'Який термін повернення товару?',
          content: 'Згідно з законодавством України, косметичні засоби належної якості не підлягають поверненню. Якщо виявлено брак або невідповідність - ми замінимо товар протягом 14 днів.'
        },
        {
          id: 'returns-2',
          title: 'Які умови повернення?',
          content: 'Повернення можливе тільки у випадку виявлення браку або невідповідності товару замовленню. Товар має бути в оригінальній упаковці, не використаний.'
        },
        {
          id: 'returns-3',
          title: 'Хто оплачує зворотну доставку?',
          content: 'У випадку виявлення браку або невідповідності - зворотну доставку оплачуємо ми. Якщо товар належної якості - зворотну доставку оплачує клієнт.'
        }
      ]
    },
    {
      id: 'products',
      title: 'Про продукцію',
      items: [
        {
          id: 'products-1',
          title: 'Чи є у вас сертифікати якості?',
          content: 'Так, всі наші товари мають сертифікати якості та відповідають стандартам України та ЄС.'
        },
        {
          id: 'products-2',
          title: 'Чи тестується продукція на тваринах?',
          content: 'Ні, всі наші бренди (зокрема Medik8) не тестують продукцію на тваринах та мають сертифікат cruelty-free.'
        },
        {
          id: 'products-3',
          title: 'Чи є алергенні компоненти?',
          content: 'Всі компоненти вказані на упаковці товару. Якщо у вас є алергія на певні компоненти, рекомендуємо проконсультуватися з косметологом перед покупкою.'
        },
        {
          id: 'products-4',
          title: 'Чи підходить для чутливої шкіри?',
          content: 'Багато наших продуктів підходять для чутливої шкіри. Рекомендуємо проконсультуватися з нашим косметологом для підбору оптимального догляду.'
        }
      ]
    }
  ];

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F1EA]">
      {/* Hero Section with Beige Background */}
      <div className="bg-[rgba(255,200,140,0.4)] py-8">
        <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
          {/* Breadcrumbs */}
          <div className="text-sm mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            головна &gt; питання
          </div>
          
          {/* Page Title */}
          <h1 
            className="text-3xl md:text-4xl font-medium uppercase tracking-[0.2em] text-center mb-2"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            FAQ
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px] py-12">
        <div className="bg-white p-6 md:p-8">
          <div className="space-y-8">
            {faqCategories.map((category) => (
              <div key={category.id}>
                <h2 
                  className="text-xl md:text-2xl font-medium uppercase tracking-[0.1em] mb-4"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {category.title}
                </h2>
                <div className="border-t border-gray-200">
                  {category.items.map((item) => (
                    <div key={item.id} className="border-b border-gray-200">
                      <button
                        className="flex justify-between items-center w-full py-4 text-left font-medium hover:text-gray-600 transition-colors"
                        onClick={() => toggleItem(item.id)}
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <span>{item.title}</span>
                        <Plus
                          size={20}
                          className={`transition-transform duration-300 flex-shrink-0 ml-4 ${
                            openItems.has(item.id) ? 'transform rotate-45' : ''
                          }`}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          openItems.has(item.id) ? 'max-h-96 pb-4' : 'max-h-0'
                        }`}
                      >
                        <p 
                          className="text-gray-600 font-light leading-relaxed"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}