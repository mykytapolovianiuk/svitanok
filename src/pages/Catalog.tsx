import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatProductForGA4 } from '../lib/analytics/ga4';
import FilterSidebar from '../components/catalog/FilterSidebar';
import ProductCard from '../components/catalog/ProductCard';
import { ProductGridSkeleton } from '../components/ui/SkeletonLoader';
import Breadcrumbs from '../components/common/Breadcrumbs';

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [problemTags, setProblemTags] = useState<string[]>([]);

  
  const category = searchParams.get('category') || undefined;
  const urlSearchQuery = searchParams.get('q') || undefined;
  const problem = searchParams.get('problem') || undefined;
  const ingredient = searchParams.get('ingredient') || undefined;
  
  
  const searchQuery = ingredient ? ingredient : urlSearchQuery;

  
  useEffect(() => {
    if (problem) {
      setProblemTags([problem]);
      setSelectedProblems([problem]);
    } else if (!problem && problemTags.length > 0) {
      
      setProblemTags([]);
      setSelectedProblems([]);
    }
  }, [problem]);

  
  useEffect(() => {
    if (ingredient) {
      
      
    }
  }, [ingredient]);

  
  const { products, loading, error, totalCount, totalPages } = useProducts({
    category,
    minPrice,
    maxPrice,
    brands: selectedBrands,
    
    problems: selectedCategories,
    sortBy,
    page: currentPage,
    pageSize: 12,
    searchQuery: urlSearchQuery, 
    problemTags: problem ? [problem] : problemTags, 
    ingredients: ingredient ? [ingredient] : [], 
  });

  
  const { trackSearch, trackFilter, trackPagination, trackViewItemList } = useAnalytics();

  
  useEffect(() => {
    if (searchQuery) {
      trackSearch(searchQuery);
    }
  }, [searchQuery, trackSearch]);

  
  useEffect(() => {
    if (selectedBrands.length > 0) {
      trackFilter('brand', selectedBrands);
    }
    if (selectedCategories.length > 0) {
      trackFilter('category', selectedCategories);
    }
    if (selectedProblems.length > 0) {
      trackFilter('problem', selectedProblems);
    }
    if (minPrice > 0 || maxPrice > 0) {
      trackFilter('price', `${minPrice}-${maxPrice}`);
    }
  }, [selectedBrands, selectedCategories, selectedProblems, minPrice, maxPrice, trackFilter]);

  
  useEffect(() => {
    if (currentPage > 1) {
      trackPagination(currentPage, 12, totalPages);
    }
  }, [currentPage, totalPages, trackPagination]);

  
  const analyticsProducts = useMemo(() => {
    return products.map((product, index) => formatProductForGA4({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.attributes?.Назва_групи || product.attributes?.Category,
      brand: product.attributes?.Виробник || product.attributes?.Brand,
      listId: 'catalog',
      listName: 'Каталог товарів',
      index: index + 1,
    }));
  }, [products]);

  useEffect(() => {
    if (products.length > 0) {
      trackViewItemList(analyticsProducts, 'catalog', 'Каталог товарів');
    }
  }, [analyticsProducts, trackViewItemList]);

  const handlePriceChange = (min: number, max: number) => {
    setMinPrice(min);
    setMaxPrice(max);
    setCurrentPage(1); 
  };

  const handleBrandsChange = (brands: string[]) => {
    setSelectedBrands(brands);
    setCurrentPage(1); 
  };

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories);
    setCurrentPage(1); 
  };

  const handleProblemsChange = (problems: string[]) => {
    setSelectedProblems(problems);
    setCurrentPage(1); 
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as any);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  
  const getPaginationRange = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i !== l + 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i as number;
    });

    return rangeWithDots;
  };

  return (
    <>
      <Breadcrumbs />
      <div className="container mx-auto px-4 py-8">
      {}
      <div className="text-center mb-8">
        <h1 
          className="text-3xl font-medium uppercase mb-2"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Товари
        </h1>
        <p 
          className="text-sm text-gray-600"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 300 }}
        >
          Оберіть ідеальний догляд для вашої шкіри
        </p>
      </div>

      {}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-2 px-4 py-2 border border-black text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}
        >
          <Filter size={16} />
          Фільтри
        </button>
      </div>

          {}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-full max-w-[320px] sm:w-80 bg-white p-4 sm:p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-semibold"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Фільтри
              </h2>
              <button onClick={() => setShowMobileFilters(false)}>
                <X size={24} />
              </button>
            </div>
            <FilterSidebar
              selectedBrands={selectedBrands}
              selectedCategories={selectedCategories}
              selectedProblems={selectedProblems}
              onBrandsChange={handleBrandsChange}
              onCategoriesChange={handleCategoriesChange}
              onProblemsChange={handleProblemsChange}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onPriceChange={handlePriceChange}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        {}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            <FilterSidebar
              selectedBrands={selectedBrands}
              selectedCategories={selectedCategories}
              selectedProblems={selectedProblems}
              onBrandsChange={handleBrandsChange}
              onCategoriesChange={handleCategoriesChange}
              onProblemsChange={handleProblemsChange}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onPriceChange={handlePriceChange}
            />
          </div>
        </aside>

        {}
        <div className="flex-1 min-w-0">
          {}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
            <p
              className="text-xs sm:text-sm text-gray-600"
              style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 300 }}
            >
              Знайдено {totalCount} товарів
            </p>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <label
                className="text-xs text-gray-600 tracking-wider whitespace-nowrap"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 300 }}
              >
                Сортувати за:
              </label>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="flex-1 sm:flex-none px-3 py-1.5 border border-gray-300 text-xs focus:outline-none focus:border-black uppercase tracking-wider min-w-[180px]"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 300 }}
              >
                <option value="newest">Рекомендовані</option>
                <option value="price_asc">Ціна: від низької до високої</option>
                <option value="price_desc">Ціна: від високої до низької</option>
              </select>
            </div>
          </div>

          {}
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : error ? (
            
            <div className="text-center py-12">
              <p className="text-red-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {error}
              </p>
            </div>
          ) : (
            
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={product.price}
                    oldPrice={product.old_price}
                    image={product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.jpg'}
                    rating={4}
                    description={product.description}
                  />
                ))}
              </div>

              {}
              {products.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Товарів не знайдено. Спробуйте змінити фільтри.
                  </p>
                </div>
              )}

              {}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {}
                  {getPaginationRange().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && handlePageChange(page)}
                      disabled={page === '...'}
                      className={`px-3 py-1.5 border ${
                        page === currentPage
                          ? 'bg-black text-white border-black'
                          : 'border-black hover:bg-black hover:text-white'
                      } ${page === '...' ? 'cursor-default' : ''} transition-colors`}
                      style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 300 }}
                    >
                      {page}
                    </button>
                  ))}

                  {}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}