import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FilterSidebarProps {
  selectedBrands: string[];
  selectedCategories: string[];
  selectedProblems: string[];
  onBrandsChange: (brands: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  onProblemsChange: (problems: string[]) => void;
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
}

export default function FilterSidebar({
  selectedBrands,
  selectedCategories,
  selectedProblems,
  onBrandsChange,
  onCategoriesChange,
  onProblemsChange,
  minPrice,
  maxPrice,
  onPriceChange,
}: FilterSidebarProps) {
  const [brandsOpen, setBrandsOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [problemsOpen, setProblemsOpen] = useState(true);
  
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  
  // Dynamic data from database
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if brand cache is older than 1 day and trigger refresh in background
  useEffect(() => {
    const checkCacheAge = () => {
      const cacheTimestamp = localStorage.getItem('svitanok_brands_cache_timestamp');
      if (cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        // If cache is older than 1 day (86400000 ms), refresh in background
        if (age > 86400000) {
          handleRefreshBrands();
        }
      }
    };
    
    // Check cache age when component mounts
    checkCacheAge();
    
    // Also fetch initial filter data
    fetchFilterData();
    
    // Check cache age every 6 hours
    const interval = setInterval(checkCacheAge, 21600000); // 6 hours
    
    return () => clearInterval(interval);
  }, []);

  const fetchFilterData = async () => {
    try {
      // Fetch unique brands from products with caching
      let brandsData: string[] = [];
      
      // Check if we have cached brand data (less than 1 hour old)
      const cachedBrands = localStorage.getItem('svitanok_brands_cache');
      const cacheTimestamp = localStorage.getItem('svitanok_brands_cache_timestamp');
      const cacheValid = cachedBrands && cacheTimestamp && 
        (Date.now() - parseInt(cacheTimestamp)) < 3600000; // 1 hour
      
      if (cacheValid) {
        brandsData = JSON.parse(cachedBrands);
        // If we have cached data, don't show loading spinner
        setLoading(false);
      } else {
        // Only show loading spinner when fetching from database
        setLoading(true);
        
        // Fetch brands from database
        const { data: brandData, error: brandError } = await supabase
          .from('products')
          .select('attributes')
          .not('attributes', 'is', null);
        
        if (brandError) {
          console.error('Error fetching brand data:', brandError);
        }
        
        if (brandData) {
          const uniqueBrands = new Set<string>();
          brandData.forEach((product: any) => {
            // Debug log to see what attributes look like
            if (process.env.NODE_ENV === 'development') {
              console.log('Product attributes:', product.attributes);
            }
            
            // Try multiple possible brand keys
            const brand = product.attributes?.Виробник || 
                         product.attributes?.Brand || 
                         product.attributes?.brand || 
                         product.attributes?.vendor || 
                         product.attributes?.Виробитель ||
                         product.attributes?.Manufacturer;
            
            if (brand && typeof brand === 'string' && brand.trim()) {
              uniqueBrands.add(brand.trim());
            } else if (brand && Array.isArray(brand) && brand.length > 0) {
              // Handle case where brand might be an array
              const firstBrand = brand[0];
              if (firstBrand && typeof firstBrand === 'string' && firstBrand.trim()) {
                uniqueBrands.add(firstBrand.trim());
              }
            }
          });
          brandsData = Array.from(uniqueBrands).sort();
          
          // Cache the results
          localStorage.setItem('svitanok_brands_cache', JSON.stringify(brandsData));
          localStorage.setItem('svitanok_brands_cache_timestamp', Date.now().toString());
          
          // Debug log to see what brands were extracted
          if (process.env.NODE_ENV === 'development') {
            console.log('Extracted brands:', brandsData);
          }
        }
      }
      
      setBrands(brandsData);
      
      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('name')
        .order('name');
      
      if (!categoryError && categoryData) {
        setCategories(categoryData.map((cat: any) => cat.name));
      }
      
      // Fetch unique problems from products
      const { data: problemData, error: problemError } = await supabase
        .from('products')
        .select('attributes')
        .not('attributes', 'is', null);
      
      if (!problemError && problemData) {
        const uniqueProblems = new Set<string>();
        problemData.forEach((product: any) => {
          // Check multiple keys for problems
          const problemKeys = ['Проблема шкіри', 'Значення_Проблеми', 'Назва_Проблеми', 'Призначення'];
          problemKeys.forEach(key => {
            const problemValue = product.attributes?.[key];
            if (problemValue) {
              if (typeof problemValue === 'string') {
                // Handle pipe-separated values
                if (problemValue.includes('|')) {
                  const parts = problemValue.split('|');
                  parts.forEach(p => {
                    if (p.trim()) uniqueProblems.add(p.trim());
                  });
                } else {
                  uniqueProblems.add(problemValue.trim());
                }
              } else if (Array.isArray(problemValue)) {
                // Handle array values
                problemValue.forEach(p => {
                  if (p && typeof p === 'string' && p.trim()) {
                    uniqueProblems.add(p.trim());
                  }
                });
              }
            }
          });
        });
        setProblems(Array.from(uniqueProblems).sort());
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      // Only hide loading if we were actually loading
      if (loading) {
        setLoading(false);
      }
    }
  };

  const handleRefreshBrands = async () => {
    try {
      // Don't show loading spinner for background refresh
      
      // Clear cache
      localStorage.removeItem('svitanok_brands_cache');
      localStorage.removeItem('svitanok_brands_cache_timestamp');
      
      // Fetch fresh brands from database
      const { data: brandData, error: brandError } = await supabase
        .from('products')
        .select('attributes')
        .not('attributes', 'is', null);
      
      if (brandError) {
        console.error('Error refreshing brand data:', brandError);
      }
      
      if (brandData) {
        const uniqueBrands = new Set<string>();
        brandData.forEach((product: any) => {
          // Try multiple possible brand keys
          const brand = product.attributes?.Виробник || 
                       product.attributes?.Brand || 
                       product.attributes?.brand || 
                       product.attributes?.vendor || 
                       product.attributes?.Виробитель ||
                       product.attributes?.Manufacturer;
          
          if (brand && typeof brand === 'string' && brand.trim()) {
            uniqueBrands.add(brand.trim());
          } else if (brand && Array.isArray(brand) && brand.length > 0) {
            // Handle case where brand might be an array
            const firstBrand = brand[0];
            if (firstBrand && typeof firstBrand === 'string' && firstBrand.trim()) {
              uniqueBrands.add(firstBrand.trim());
            }
          }
        });
        const brandsData = Array.from(uniqueBrands).sort();
        
        // Update cache
        localStorage.setItem('svitanok_brands_cache', JSON.stringify(brandsData));
        localStorage.setItem('svitanok_brands_cache_timestamp', Date.now().toString());
        
        setBrands(brandsData);
      }
    } catch (error) {
      console.error('Error refreshing brand data:', error);
    }
  };

  const handleBrandToggle = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter((b) => b !== brand));
    } else {
      onBrandsChange([...selectedBrands, brand]);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const handleProblemToggle = (problem: string) => {
    if (selectedProblems.includes(problem)) {
      onProblemsChange(selectedProblems.filter((p) => p !== problem));
    } else {
      onProblemsChange([...selectedProblems, problem]);
    }
  };

  const handlePriceApply = () => {
    // Validate price inputs
    let min = localMinPrice;
    let max = localMaxPrice;
    
    // Ensure min is not greater than max
    if (min > max && max > 0) {
      [min, max] = [max, min]; // Swap values
    }
    
    onPriceChange(min, max);
  };

  // Custom checkbox component
  const CustomCheckbox = ({ 
    checked, 
    onChange,
    label
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
  }) => (
    <label className="flex items-center cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className="w-4 h-4 border border-black mr-3 flex items-center justify-center">
        {checked && <div className="w-2 h-2 bg-black"></div>}
      </div>
      <span 
        className="text-xs tracking-wider"
        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 300 }}
      >
        {label}
      </span>
    </label>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h2
          className="text-xs font-medium uppercase tracking-[0.3em] border-b border-black pb-2"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          ФІЛЬТРУВАТИ ЗА
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2
        className="text-xs font-medium uppercase tracking-[0.3em] border-b border-black pb-2"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        ФІЛЬТРУВАТИ ЗА
      </h2>

      {/* Brands Filter */}
      <div className="pb-4">
        <button
          onClick={() => setBrandsOpen(!brandsOpen)}
          className="flex items-center justify-between w-full py-2"
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            БРЕНД
          </span>
          {brandsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {brandsOpen && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {brands.length > 0 ? (
              brands.map((brand) => (
                <CustomCheckbox
                  key={brand}
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                  label={brand}
                />
              ))
            ) : (
              <p className="text-xs text-gray-500">Бренди не знайдено</p>
            )}
          </div>
        )}
      </div>

      {/* Categories Filter */}
      <div className="pb-4">
        <button
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="flex items-center justify-between w-full py-2"
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ТИП
          </span>
          {categoriesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {categoriesOpen && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {categories.map((category) => (
              <CustomCheckbox
                key={category}
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                label={category}
              />
            ))}
          </div>
        )}
      </div>

      {/* Problems Filter */}
      <div className="pb-4">
        <button
          onClick={() => setProblemsOpen(!problemsOpen)}
          className="flex items-center justify-between w-full py-2"
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ПРОБЛЕМА
          </span>
          {problemsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {problemsOpen && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {problems.map((problem) => (
              <CustomCheckbox
                key={problem}
                checked={selectedProblems.includes(problem)}
                onChange={() => handleProblemToggle(problem)}
                label={problem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="pb-4">
        <button
          onClick={() => setPriceOpen(!priceOpen)}
          className="flex items-center justify-between w-full py-2"
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ЦІНА
          </span>
          {priceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {priceOpen && (
          <div className="mt-3 space-y-3">
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Від"
                value={localMinPrice > 0 ? localMinPrice : ''}
                onChange={(e) => setLocalMinPrice(e.target.value ? Number(e.target.value) : 0)}
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:border-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                min="0"
              />
              <input
                type="number"
                placeholder="До"
                value={localMaxPrice > 0 ? localMaxPrice : ''}
                onChange={(e) => setLocalMaxPrice(e.target.value ? Number(e.target.value) : 0)}
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:border-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                min="0"
              />
            </div>
            <button
              onClick={handlePriceApply}
              className="w-full border border-black py-2 text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}
            >
              Застосувати
            </button>
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      {(selectedBrands.length > 0 || 
        selectedCategories.length > 0 || 
        selectedProblems.length > 0 || 
        minPrice > 0 || maxPrice > 0) && (
        <button
          onClick={() => {
            onBrandsChange([]);
            onCategoriesChange([]);
            onProblemsChange([]);
            onPriceChange(0, 0);
            setLocalMinPrice(0);
            setLocalMaxPrice(0);
          }}
          className="w-full text-xs tracking-wider underline"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 300 }}
        >
          ОЧИСТИТИ ФІЛЬТРИ
        </button>
      )}
            
      {/* Refresh Brands Button - Hidden but accessible for debugging */}
      <button
        onClick={handleRefreshBrands}
        className="hidden"
        aria-label="Refresh brands"
        id="refresh-brands-button"
      />
    </div>
  );
}