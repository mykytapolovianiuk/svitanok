import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      setLoading(true);
      
      // Fetch unique brands from products
      const { data: brandData, error: brandError } = await supabase
        .from('products')
        .select('attributes')
        .not('attributes', 'is', null);
      
      if (!brandError && brandData) {
        const uniqueBrands = new Set<string>();
        brandData.forEach(product => {
          const brand = product.attributes?.Виробник || product.attributes?.Brand;
          if (brand) {
            uniqueBrands.add(brand);
          }
        });
        setBrands(Array.from(uniqueBrands).sort());
      }
      
      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('name')
        .order('name');
      
      if (!categoryError && categoryData) {
        setCategories(categoryData.map(cat => cat.name));
      }
      
      // Fetch unique problems from products
      const { data: problemData, error: problemError } = await supabase
        .from('products')
        .select('attributes')
        .not('attributes', 'is', null);
      
      if (!problemError && problemData) {
        const uniqueProblems = new Set<string>();
        problemData.forEach(product => {
          // Check multiple keys for problems
          const problemKeys = ['Проблема шкіри', 'Значення_Проблеми', 'Назва_Проблеми', 'Призначення'];
          problemKeys.forEach(key => {
            const problemValue = product.attributes?.[key];
            if (problemValue) {
              if (typeof problemValue === 'string') {
                // Handle pipe-separated values
                if (problemValue.includes('|')) {
                  problemValue.split('|').forEach(p => {
                    if (p.trim()) uniqueProblems.add(p.trim());
                  });
                } else {
                  uniqueProblems.add(problemValue.trim());
                }
              }
            }
          });
        });
        setProblems(Array.from(uniqueProblems).sort());
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    } finally {
      setLoading(false);
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
    onPriceChange(localMinPrice, localMaxPrice);
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
            {brands.map((brand) => (
              <CustomCheckbox
                key={brand}
                checked={selectedBrands.includes(brand)}
                onChange={() => handleBrandToggle(brand)}
                label={brand}
              />
            ))}
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
                value={localMinPrice || ''}
                onChange={(e) => setLocalMinPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:border-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              />
              <input
                type="number"
                placeholder="До"
                value={localMaxPrice || ''}
                onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 text-xs focus:outline-none focus:border-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
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
    </div>
  );
}