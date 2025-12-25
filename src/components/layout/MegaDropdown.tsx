import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface MegaDropdownProps {
  label: string;
  to?: string;
}

interface DropdownItem {
  name: string;
  slug: string;
  count?: number;
}

interface Column {
  title: string;
  items: DropdownItem[];
  linkPrefix: string;
  useSearch: boolean;
  useSlug: boolean;
  filterKey?: string;
}

export default function MegaDropdown({ label, to }: MegaDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  
  const { data: dropdownData, isLoading } = useQuery({
    queryKey: ['megaDropdown'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('attributes, id, name, slug, in_stock, category')
        .eq('in_stock', true);

      if (error) throw error;

      
      const productTypesMap = new Map<string, number>();
      products?.forEach((product) => {
        const type = 
          product.category ||
          product.attributes?.Назва_групи || 
          product.attributes?.Category ||
          product.attributes?.category ||
          product.attributes?.Тип_продукту;
        
        if (type) {
          const count = productTypesMap.get(type) || 0;
          productTypesMap.set(type, count + 1);
        }
      });

      
      const problemsMap = new Map<string, number>();
      products?.forEach((product) => {
        
        if (product.attributes?.problem_tags && Array.isArray(product.attributes.problem_tags)) {
          product.attributes.problem_tags.forEach((problem: string) => {
            if (problem) {
              const count = problemsMap.get(problem) || 0;
              problemsMap.set(problem, count + 1);
            }
          });
        }
        
        
        const problems = 
          product.attributes?.Проблема ||
          product.attributes?.Проблеми ||
          product.attributes?.Problem ||
          product.attributes?.Призначення;
        
        if (problems) {
          const problemList = Array.isArray(problems) 
            ? problems 
            : typeof problems === 'string' 
              ? problems.split(/[,|]/).map(p => p.trim())
              : [];
          
          problemList.forEach((problem: string) => {
            if (problem) {
              const count = problemsMap.get(problem) || 0;
              problemsMap.set(problem, count + 1);
            }
          });
        }
      });

      
      const ingredientsMap = new Map<string, number>();
      products?.forEach((product) => {
        
        if (product.attributes?.ingredients && Array.isArray(product.attributes.ingredients)) {
          product.attributes.ingredients.forEach((ingredient: string) => {
            if (ingredient) {
              const count = ingredientsMap.get(ingredient) || 0;
              ingredientsMap.set(ingredient, count + 1);
            }
          });
        }
        
        
        const ingredients = 
          product.attributes?.Інгредієнти ||
          product.attributes?.Ingredient ||
          product.attributes?.Ingredients ||
          product.attributes?.Ключові_інгредієнти ||
          product.attributes?.['Ключові інгредієнти'] ||
          product.attributes?.['Ключові_інгредієнти'];
        
        if (ingredients) {
          const ingredientList = Array.isArray(ingredients) 
            ? ingredients 
            : typeof ingredients === 'string' 
              ? ingredients.split(/[,|]/).map(i => i.trim())
              : [];
          
          ingredientList.forEach((ingredient: string) => {
            if (ingredient) {
              const count = ingredientsMap.get(ingredient) || 0;
              ingredientsMap.set(ingredient, count + 1);
            }
          });
        }
      });

      
      const { data: bestsellers } = await supabase
        .from('products')
        .select('id, name, slug, images')
        .eq('in_stock', true)
        .eq('is_featured', true)
        .limit(8);

      const productTypes: DropdownItem[] = Array.from(productTypesMap.entries())
        .map(([name, count]) => ({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, ''),
          count,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
        .slice(0, 15);

      const problems: DropdownItem[] = Array.from(problemsMap.entries())
        .map(([name, count]) => ({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, ''),
          count,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
        .slice(0, 15);

      const ingredients: DropdownItem[] = Array.from(ingredientsMap.entries())
        .map(([name, count]) => ({
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, ''),
          count,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
        .slice(0, 15);

      const bestsellersList: DropdownItem[] = (bestsellers || []).map((product) => ({
        name: product.name,
        slug: product.slug,
      }));

      return {
        productTypes,
        problems,
        ingredients,
        bestsellers: bestsellersList,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (column: Column, item: DropdownItem) => {
    setIsOpen(false);
    
    if (column.useSlug) {
      navigate(`${column.linkPrefix}${item.slug}`);
    } else if (column.filterKey) {
      
      navigate(`/catalog?${column.filterKey}=${encodeURIComponent(item.name)}`);
    } else {
      navigate(`${column.linkPrefix}${encodeURIComponent(item.name)}`);
    }
  };

  const columns: Column[] = [
    {
      title: 'ТИП ПРОДУКТУ',
      items: dropdownData?.productTypes || [],
      linkPrefix: '/catalog?category=',
      useSearch: false,
      useSlug: false,
      filterKey: 'category',
    },
    {
      title: 'ЗА ПРОБЛЕМОЮ',
      items: dropdownData?.problems || [],
      linkPrefix: '/catalog?problem=',
      useSearch: false,
      useSlug: false,
      filterKey: 'problem',
    },
    {
      title: 'ЗА ІНГРЕДІЄНТАМИ',
      items: dropdownData?.ingredients || [],
      linkPrefix: '/catalog?ingredient=',
      useSearch: false,
      useSlug: false,
      filterKey: 'ingredient',
    },
    {
      title: 'БЕСТСЕЛЕРИ',
      items: dropdownData?.bestsellers || [],
      linkPrefix: '/product/',
      useSearch: false,
      useSlug: true,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="flex items-center text-text-main hover:opacity-70 transition"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        {to ? (
          <Link to={to} className="flex items-center">
            {label}
          </Link>
        ) : (
          <span>{label}</span>
        )}
        <ChevronDown 
          size={16} 
          className={`ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-[90vw] md:w-[1000px] max-w-[1000px] bg-white border border-gray-200 shadow-2xl z-50 rounded-lg overflow-hidden hidden md:block"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Завантаження...</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-0">
              {columns.map((column, idx) => (
                <div 
                  key={idx} 
                  className={`p-6 ${idx < columns.length - 1 ? 'border-r border-gray-200' : ''}`}
                >
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {column.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {column.items.length === 0 ? (
                      <li className="text-xs text-gray-400 py-2">Немає даних</li>
                    ) : (
                      <>
                        {}
                        {idx === 0 && (
                          <li>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/catalog');
                              }}
                              className="w-full text-left text-sm text-gray-700 hover:text-gray-900 transition-colors py-1.5"
                            >
                              Всі продукти
                            </button>
                          </li>
                        )}
                        {idx === 3 && (
                          <li>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/catalog?featured=true');
                              }}
                              className="w-full text-left text-sm text-gray-700 hover:text-gray-900 transition-colors py-1.5"
                            >
                              Всі бестселери
                            </button>
                          </li>
                        )}
                        {column.items.map((item, itemIdx) => (
                          <li key={itemIdx}>
                            <button
                              onClick={() => handleItemClick(column, item)}
                              className="w-full text-left text-sm text-gray-700 hover:text-gray-900 transition-colors py-1.5 leading-relaxed"
                            >
                              {item.name}
                            </button>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-x-0 top-16 bg-white border-t border-gray-200 shadow-lg z-50 max-h-[80vh] overflow-y-auto"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Завантаження...</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {columns.map((column, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">
                    {column.title}
                  </h3>
                  <ul className="space-y-1">
                    {column.items.length === 0 ? (
                      <li className="text-xs text-gray-400 py-2">Немає даних</li>
                    ) : (
                      <>
                        {idx === 0 && (
                          <li>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/catalog');
                              }}
                              className="w-full text-left text-sm text-gray-700 hover:text-gray-900 transition-colors py-2"
                            >
                              Всі продукти
                            </button>
                          </li>
                        )}
                        {idx === 3 && (
                          <li>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/catalog?featured=true');
                              }}
                              className="w-full text-left text-sm text-gray-700 hover:text-gray-900 transition-colors py-2"
                            >
                              Всі бестселери
                            </button>
                          </li>
                        )}
                        {column.items.slice(0, 6).map((item, itemIdx) => (
                          <li key={itemIdx}>
                            <button
                              onClick={() => handleItemClick(column, item)}
                              className="w-full text-left text-sm text-gray-700 hover:text-gray-900 transition-colors py-2"
                            >
                              {item.name}
                            </button>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
