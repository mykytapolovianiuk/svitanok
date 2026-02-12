import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useFilterData } from '@/hooks/useFilterData';
import { formatAttributeValue } from '@/lib/constants';

interface FilterSidebarProps {
  selectedBrands: string[];
  selectedCategories: string[];
  selectedSkinTypes: string[];
  minPrice: number;
  maxPrice: number;
  onBrandsChange: (brands: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  onSkinTypesChange: (skinTypes: string[]) => void;
  onPriceChange: (min: number, max: number) => void;
}

// Optimization: Memoized Checkbox Component
const CustomCheckbox = memo(({
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
    <div className="w-4 h-4 border border-black mr-3 flex items-center justify-center shrink-0 mt-0.5 transition-colors group-hover:border-gray-500">
      {checked && <div className="w-2 h-2 bg-black"></div>}
    </div>
    <span
      className="text-xs tracking-wider select-none"
      style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 300 }}
    >
      {label}
    </span>
  </label>
));

CustomCheckbox.displayName = 'CustomCheckbox';

function FilterSidebar({
  selectedBrands,
  selectedCategories,
  selectedSkinTypes,
  minPrice,
  maxPrice,
  onBrandsChange,
  onCategoriesChange,
  onSkinTypesChange,
  onPriceChange,
}: FilterSidebarProps) {
  const [brandsOpen, setBrandsOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [skinTypeOpen, setSkinTypeOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  // Sync local price state when props change
  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Use the React Query hook for data
  const {
    availableBrands,
    availableCategories,
    skinTypes,
    loading,
  } = useFilterData();

  // Optimization: Filter logic derived from props and data
  // Logic: If Category selected -> Filter Brands. If Brand selected -> Filter Categories.

  // Note: The previous logic in useFilterData hook was doing circular filtering.
  // Ideally, available options should be handled by the server or complex client logic.
  // For now, we'll keep it simple to avoid infinite loops or empty states.

  const filteredCategories = availableCategories;
  const filteredBrands = availableBrands;

  // Handlers wrapped in useCallback to prevent re-renders of child components
  const handleBrandToggle = useCallback((brandId: string) => {
    let newBrands: string[];
    if (selectedBrands.includes(brandId)) {
      newBrands = selectedBrands.filter(id => id !== brandId);
    } else {
      newBrands = [...selectedBrands, brandId];
    }

    onBrandsChange(newBrands);

    // If user cleared all brands, clear categories too (optional business logic)
    if (newBrands.length === 0) {
      onCategoriesChange([]);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedBrands, onBrandsChange, onCategoriesChange]);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategories, onCategoriesChange]);

  const handleSkinTypeToggle = useCallback((skinType: string) => {
    if (selectedSkinTypes.includes(skinType)) {
      onSkinTypesChange(selectedSkinTypes.filter(st => st !== skinType));
    } else {
      onSkinTypesChange([...selectedSkinTypes, skinType]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedSkinTypes, onSkinTypesChange]);

  const handlePriceApply = useCallback(() => {
    let min = localMinPrice;
    let max = localMaxPrice;
    if (min > max && max > 0) [min, max] = [max, min];
    onPriceChange(min, max);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [localMinPrice, localMaxPrice, onPriceChange]);

  const handleClearFilters = useCallback(() => {
    onBrandsChange([]);
    onCategoriesChange([]);
    onSkinTypesChange([]);
    onPriceChange(0, 0);
    setLocalMinPrice(0);
    setLocalMaxPrice(0);
  }, [onBrandsChange, onCategoriesChange, onSkinTypesChange, onPriceChange]);

  // SKELETON LOADER
  if (loading) {
    return (
      <div className="space-y-8 min-h-[600px] animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 w-1/3 rounded"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-100 w-1/2 rounded"></div>
            <div className="h-8 bg-gray-100 w-1/2 rounded"></div>
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 w-24 rounded"></div>
              <div className="h-4 bg-gray-200 w-4 rounded"></div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(j => <div key={j} className="h-3 bg-gray-100 w-full rounded"></div>)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show categories only if at least one brand is selected
  const showCategories = selectedBrands.length > 0;

  return (
    <div className="space-y-6 min-h-[500px]">
      <h2
        className="text-xs font-medium uppercase tracking-[0.3em] border-b border-black pb-2"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        ФІЛЬТРУВАТИ ЗА
      </h2>

      {/* Price Filter */}
      <div className="pb-4 border-b border-gray-100">
        <button
          onClick={() => setPriceOpen(!priceOpen)}
          className="flex items-center justify-between w-full py-2 group"
        >
          <span className="text-xs font-medium uppercase tracking-widest group-hover:text-gray-600 transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            ЦІНА
          </span>
          {priceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {priceOpen && (
          <div className="mt-3 space-y-3 animate-fadeIn">
            <div className="flex gap-3">
              <div className="relative w-full">
                <span className="absolute left-2 top-2 text-xs text-gray-400">Від</span>
                <input
                  type="number"
                  value={localMinPrice > 0 ? localMinPrice : ''}
                  onChange={(e) => setLocalMinPrice(e.target.value ? Number(e.target.value) : 0)}
                  className="w-full pl-8 pr-2 py-2 border border-gray-300 text-xs focus:outline-none focus:border-black"
                  min="0"
                />
              </div>
              <div className="relative w-full">
                <span className="absolute left-2 top-2 text-xs text-gray-400">До</span>
                <input
                  type="number"
                  value={localMaxPrice > 0 ? localMaxPrice : ''}
                  onChange={(e) => setLocalMaxPrice(e.target.value ? Number(e.target.value) : 0)}
                  className="w-full pl-8 pr-2 py-2 border border-gray-300 text-xs focus:outline-none focus:border-black"
                  min="0"
                />
              </div>
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
      <div className="pb-4 border-b border-gray-100">
        <button
          onClick={() => setBrandsOpen(!brandsOpen)}
          className="flex items-center justify-between w-full py-2 group"
        >
          <span className="text-xs font-medium uppercase tracking-widest group-hover:text-gray-600 transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            БРЕНД
          </span>
          {brandsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {brandsOpen && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
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
              <p className="text-xs text-gray-500 italic">Бренди не знайдено</p>
            )}
          </div>
        )}
      </div>

      {/* Categories Filter (ТІЛЬКИ ЯКЩО ОБРАНО БРЕНД) */}
      {showCategories && (
        <div className="pb-4 border-b border-gray-100 animate-slideDown">
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className="flex items-center justify-between w-full py-2 group"
          >
            <span className="text-xs font-medium uppercase tracking-widest group-hover:text-gray-600 transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              КАТЕГОРІЯ
            </span>
            {categoriesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {categoriesOpen && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
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
                <p className="text-xs text-gray-500 italic">Немає категорій для цього бренду</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Skin Type Filter */}
      <div className="pb-4 border-b border-gray-100">
        <button
          onClick={() => setSkinTypeOpen(!skinTypeOpen)}
          className="flex items-center justify-between w-full py-2 group"
        >
          <span className="text-xs font-medium uppercase tracking-widest group-hover:text-gray-600 transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            ТИП ШКІРИ
          </span>
          {skinTypeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {skinTypeOpen && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2">
            {skinTypes.map((skinType) => (
              <CustomCheckbox
                key={skinType}
                checked={selectedSkinTypes.includes(skinType)}
                onChange={() => handleSkinTypeToggle(skinType)}
                label={formatAttributeValue('Тип шкіри', skinType)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      {(
        selectedBrands.length > 0 ||
        selectedCategories.length > 0 ||
        selectedSkinTypes.length > 0 ||
        minPrice > 0 ||
        maxPrice > 0
      ) && (
          <div className="pt-4">
            <button
              onClick={handleClearFilters}
              className="w-full py-3 text-xs uppercase tracking-wider text-white bg-black hover:bg-gray-800 transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}
            >
              ОЧИСТИТИ ВСІ ФІЛЬТРИ
            </button>
          </div>
        )}
    </div>
  );
}

// Wrap main component in memo to prevent re-renders when parent changes but props are same
export default memo(FilterSidebar);