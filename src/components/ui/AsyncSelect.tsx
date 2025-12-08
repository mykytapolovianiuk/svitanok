import { useState, useCallback, useRef } from 'react';

// Custom debounce function
function useAsyncDebounce<T extends (...args: any[]) => any>(func: T, delay: number): T & { cancel: () => void } {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunc = useCallback(((...args: Parameters<T>) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      func(...args);
    }, delay);
  }) as T, [func, delay]);

  // Add cancel method
  (debouncedFunc as any).cancel = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  };

  return debouncedFunc as T & { cancel: () => void };
}

interface AsyncSelectProps {
  loadOptions: (inputValue: string) => Promise<{ value: string; label: string; ref?: string }[]>;
  value: { value: string; label: string; ref?: string } | null;
  onChange: (option: { value: string; label: string; ref?: string } | null) => void;
  placeholder?: string;
  error?: string;
  isLoading?: boolean;
}

export default function AsyncSelect({
  loadOptions,
  value,
  onChange,
  placeholder = 'Оберіть...',
  error,
  isLoading: externalIsLoading = false,
}: AsyncSelectProps) {
  // Production logging removed
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<{ value: string; label: string; ref?: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  const isLoading = externalIsLoading || internalIsLoading;

  const debouncedLoadOptions = useAsyncDebounce(async (input: string) => {
    if (input.length < 2) {
      setOptions([]);
      return;
    }

    setInternalIsLoading(true);
    try {
      const results = await loadOptions(input);
      // Production logging removed
      setOptions(results);
    } catch (error) {
      console.error('Error loading options:', error);
      setOptions([]);
    } finally {
      setInternalIsLoading(false);
    }
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Production logging removed
    setInputValue(value);
    debouncedLoadOptions(value);
  };

  const handleSelect = (option: { value: string; label: string; ref?: string }) => {
    // Production logging removed
    onChange(option);
    setIsOpen(false);
    setInputValue(option.label);
    // Cancel any pending debounced calls
    debouncedLoadOptions.cancel();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay to allow click on options
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const displayValue = value?.label || inputValue || '';
  // Production logging removed

  return (
    <div className="relative mb-4">
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${isLoading ? 'bg-gray-50' : ''}`}
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      />
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Завантаження...
            </div>
          ) : options.length > 0 ? (
            <div>
              {options.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(option);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          ) : inputValue.length >= 2 ? (
            <div className="px-4 py-2 text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Нічого не знайдено
            </div>
          ) : (
            <div className="px-4 py-2 text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Введіть не менше 2 символів для пошуку
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {error}
        </p>
      )}
    </div>
  );
}
