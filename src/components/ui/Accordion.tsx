import { useState, useRef } from 'react';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const accordionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const toggleItem = (id: string) => {
    const newOpenState = openItemId === id ? null : id;
    setOpenItemId(newOpenState);
    
    
    if (newOpenState && accordionRefs.current[id]) {
      accordionRefs.current[id]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  return (
    <div className="border-t border-gray-200">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="border-b border-gray-200"
          ref={(el) => (accordionRefs.current[item.id] = el)}
        >
          <button
            className="flex justify-between items-center w-full py-4 text-left font-medium hover:text-gray-600 transition-colors"
            onClick={() => toggleItem(item.id)}
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <span>{item.title}</span>
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${
                openItemId === item.id ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              openItemId === item.id ? 'max-h-96 pb-4' : 'max-h-0'
            }`}
          >
            <p 
              className="text-gray-600"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {item.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}