import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useFilterData } from '@/hooks/useFilterData';

interface FilterSidebarProps {
  selectedBrands: string[];
  selectedCategories: string[];
  selectedSkinTypes: string[];
  selectedProblems: string[];
  selectedClasses: string[];
  minPrice: number;
  maxPrice: number;
  onBrandsChange: (brands: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  onSkinTypesChange: (skinTypes: string[]) => void;
  onProblemsChange: (problems: string[]) => void;
  onClassesChange: (classes: string[]) => void;
  onPriceChange: (min: number, max: number) => void;
}

export default function FilterSidebar({
  selectedBrands,
  selectedCategories,
  selectedSkinTypes,
  selectedProblems,
  selectedClasses,
  minPrice,
  maxPrice,
  onBrandsChange,
  onCategoriesChange,
  onSkinTypesChange,
  onProblemsChange,
  onClassesChange,
  onPriceChange,
}: FilterSidebarProps) {
  const [brandsOpen, setBrandsOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [skinTypeOpen, setSkinTypeOpen] = useState(true);
  const [problemsOpen, setProblemsOpen] = useState(true);
  const [classesOpen, setClassesOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  
  const {
    availableBrands,
    availableCategories,
    skinTypes,
    problems,
    cosmeticClasses,
    loading,
    getAvailableCategories,
    getAvailableBrands
  } = useFilterData();

  // Convert string IDs to numbers for the hook
  const selectedBrandIds = useMemo(() => 
    selectedBrands.map(id => parseInt(id)).filter(id => !isNaN(id)), 
    [selectedBrands]
  );
  
  const selectedCategoryIds = selectedCategories;

  // Get dynamically filtered options
  const filteredCategories = useMemo(() => {
    if (selectedBrandIds.length > 0) {
      return getAvailableCategories(selectedBrandIds);
    }
    return availableCategories;
  }, [selectedBrandIds, availableCategories, getAvailableCategories]);

  const filteredBrands = useMemo(() => {
    if (selectedCategoryIds.length > 0) {
      return getAvailableBrands(selectedCategoryIds);
    }
    return availableBrands;
  }, [selectedCategoryIds, availableBrands, getAvailableBrands]);

  // Handle filter changes
  const handleBrandToggle = (brandId: string) => {
    if (selectedBrands.includes(brandId)) {
      onBrandsChange(selectedBrands.filter(id => id !== brandId));
    } else {
      onBrandsChange([...selectedBrands, brandId]);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const handleSkinTypeToggle = (skinType: string) => {
    if (selectedSkinTypes.includes(skinType)) {
      onSkinTypesChange(selectedSkinTypes.filter(st => st !== skinType));
    } else {
      onSkinTypesChange([...selectedSkinTypes, skinType]);
    }
  };

  const handleProblemToggle = (problem: string) => {
    if (selectedProblems.includes(problem)) {
      onProblemsChange(selectedProblems.filter(p => p !== problem));
    } else {
      onProblemsChange([...selectedProblems, problem]);
    }
  };

  const handleClassToggle = (cosmeticClass: string) => {
    if (selectedClasses.includes(cosmeticClass)) {
      onClassesChange(selectedClasses.filter(c => c !== cosmeticClass));
    } else {
      onClassesChange([...selectedClasses, cosmeticClass]);
    }
  };

  const handlePriceApply = () => {
    let min = localMinPrice;
    let max = localMaxPrice;
    
    if (min > max && max > 0) {
      [min, max] = [max, min];
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
    <label className="flex items-start cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className="w-4 h-4 border border-black mr-3 flex items-center justify-center shrink-0 mt-0.5">
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
            {filteredBrands.length > 0 ? (
              filteredBrands.map((brand) => (
                <CustomCheckbox
                  key={brand.id}
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => handleBrandToggle(brand.id)}
                  label={brand.name}
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
            КАТЕГОРІЯ
          </span>
          {categoriesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {categoriesOpen && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <CustomCheckbox
                  key={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  label={category.name}
                />
              ))
            ) : (
              <p className="text-xs text-gray-500">Категорії не знайдено</p>
            )}
          </div>
        )}
      </div>

      {/* Skin Type Filter */}
      <div className="pb-4">
        <button
          onClick={() => setSkinTypeOpen(!skinTypeOpen)}
          className="flex items-center justify-between w-full py-2"
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ТИП ШКІРИ
          </span>
          {skinTypeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {skinTypeOpen && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {skinTypes.map((skinType) => (
              <CustomCheckbox
                key={skinType}
                checked={selectedSkinTypes.includes(skinType)}
                onChange={() => handleSkinTypeToggle(skinType)}
                label={skinType}
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

      {/* Cosmetic Class Filter */}
      <div className="pb-4">
        <button
          onClick={() => setClassesOpen(!classesOpen)}
          className="flex items-center justify-between w-full py-2"
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            КЛАС КОСМЕТИКИ
          </span>
          {classesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {classesOpen && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {cosmeticClasses.map((cosmeticClass) => (
              <CustomCheckbox
                key={cosmeticClass}
                checked={selectedClasses.includes(cosmeticClass)}
                onChange={() => handleClassToggle(cosmeticClass)}
                label={cosmeticClass}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      {(selectedBrands.length > 0 || 
        selectedCategories.length > 0 || 
        selectedSkinTypes.length > 0 ||
        selectedProblems.length > 0 || 
        selectedClasses.length > 0 ||
        minPrice > 0 || maxPrice > 0) && (
        <button
          onClick={() => {
            onBrandsChange([]);
            onCategoriesChange([]);
            onSkinTypesChange([]);
            onProblemsChange([]);
            onClassesChange([]);
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