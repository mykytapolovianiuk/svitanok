import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, User, ShoppingBag, Menu, X, Loader2 } from 'lucide-react';
import { useCartStore, useCartTotalItems } from '../../store/cartStore';
import { useUserStore } from '../../features/auth/useUserStore';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SearchProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

export default function Header() {
  const [showFavoritesTooltip, setShowFavoritesTooltip] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toggleCart } = useCartStore();
  const totalItems = useCartTotalItems();
  const { session } = useUserStore();
  const { fetchSettings } = useSiteSettings();

  // Search products query
  const { data: searchResults = [], isLoading: isSearchLoading } = useQuery<SearchProduct[]>({
    queryKey: ['search-products', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, images')
        .ilike('name', `%${searchQuery.trim()}%`)
        .eq('in_stock', true)
        .limit(8);

      if (error) throw error;
      return (data || []) as SearchProduct[];
    },
    enabled: searchQuery.length >= 2 && isSearchOpen,
    staleTime: 30000,
  });

  // Initialize site settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Focus search input when it opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && selectedIndex >= 0 && searchResults[selectedIndex]) {
        e.preventDefault();
        handleProductClick(searchResults[selectedIndex]);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, searchResults, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && searchResultsRef.current) {
      const selectedElement = searchResultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  const handleHeartClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      setShowFavoritesTooltip(true);
      setTimeout(() => setShowFavoritesTooltip(false), 3000);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSearchIconClick = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery('');
    }
  };

  const handleProductClick = (product: SearchProduct) => {
    navigate(`/product/${encodeURIComponent(product.slug)}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const showSearchResults = isSearchOpen && searchQuery.length >= 2;

  return (
    <header className="font-sans bg-primary relative z-50">
      {/* Main Navigation Bar */}
      <div className='header-container'>
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex h-14 md:h-16 items-center justify-center relative">
            {/* Logo */}
            <Link 
              to="/" 
              className="absolute left-0 text-lg md:text-2xl font-bold text-text-main tracking-wider"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              SVITANOK
            </Link>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 mx-auto">
              <Link 
                to="/catalog" 
                className="text-text-main hover:opacity-70 transition text-sm xl:text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Каталог
              </Link>
              <Link 
                to="/about" 
                className="text-text-main hover:opacity-70 transition text-sm xl:text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Про бренд
              </Link>
              <Link 
                to="/skincare-regimen" 
                className="text-text-main hover:opacity-70 transition text-sm xl:text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Режим догляду за шкірою
              </Link>
              <Link 
                to="/autumn-care" 
                className="text-text-main hover:opacity-70 transition text-sm xl:text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Догляд восени
              </Link>
              <Link 
                to="/faq" 
                className="text-text-main hover:opacity-70 transition text-sm xl:text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                FAQ
              </Link>
              <Link 
                to="/delivery" 
                className="text-text-main hover:opacity-70 transition text-sm xl:text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Доставка
              </Link>
              <Link 
                to="/returns" 
                className="text-text-main hover:opacity-70 transition text-sm xl:text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Обмін та повернення
              </Link>
            </nav>

            {/* Right Side Icons */}
            <div className="absolute right-0 flex items-center space-x-3 md:space-x-4">
              {/* Search Icon */}
              <button 
                onClick={handleSearchIconClick}
                className="text-text-main hover:opacity-70 transition"
                aria-label="Пошук"
              >
                <Search size={20} />
              </button>

              {/* Favorites Icon */}
              <div className="relative">
                <Link 
                  to="/favorites" 
                  onClick={handleHeartClick}
                  className="text-text-main hover:opacity-70 transition relative"
                  aria-label="Обране"
                >
                  <Heart size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
                {showFavoritesTooltip && (
                  <div className="absolute top-full right-0 mt-2 bg-black text-white text-xs py-2 px-3 rounded whitespace-nowrap z-50">
                    Увійдіть в акаунт
                  </div>
                )}
              </div>

              {/* User Icon */}
              <Link 
                to="/auth" 
                className="text-text-main hover:opacity-70 transition"
                aria-label="Профіль"
              >
                <User size={20} />
              </Link>

              {/* Cart Icon */}
              <button 
                onClick={toggleCart}
                className="text-text-main hover:opacity-70 transition relative"
                aria-label="Кошик"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-text-main hover:opacity-70 transition"
                aria-label="Меню"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="container mx-auto px-4 py-6" ref={searchContainerRef}>
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-xl font-medium uppercase tracking-widest"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Пошук
              </h2>
              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search 
                  size={20} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Введіть назву товару..."
                  className="w-full pl-10 pr-4 py-3 border-b border-gray-300 focus:outline-none focus:border-black text-lg"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
              </div>
            </form>

            {showSearchResults && (
              <div>
                {isSearchLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div ref={searchResultsRef} className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {searchResults.map((product, index) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className={`w-full text-left p-3 rounded hover:bg-gray-50 transition-colors ${
                          index === selectedIndex ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          {product.images[0] && (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-12 h-12 object-cover mr-4 rounded"
                            />
                          )}
                          <div>
                            <h3 
                              className="font-medium text-gray-900"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              {product.name}
                            </h3>
                            <p 
                              className="text-gray-600"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              {product.price} грн
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Товарів не знайдено</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-8">
              <Link 
                to="/" 
                className="text-2xl font-bold text-text-main tracking-wider"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                onClick={closeMobileMenu}
              >
                SVITANOK
              </Link>
              <button 
                onClick={closeMobileMenu}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <nav className="flex-1">
              <ul className="space-y-6">
                <li>
                  <Link 
                    to="/catalog" 
                    className="block text-2xl font-medium text-text-main py-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    onClick={closeMobileMenu}
                  >
                    Каталог
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/about" 
                    className="block text-2xl font-medium text-text-main py-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    onClick={closeMobileMenu}
                  >
                    Про бренд
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/skincare-regimen" 
                    className="block text-2xl font-medium text-text-main py-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    onClick={closeMobileMenu}
                  >
                    Режим догляду за шкірою
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/autumn-care" 
                    className="block text-2xl font-medium text-text-main py-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    onClick={closeMobileMenu}
                  >
                    Догляд восени
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/faq" 
                    className="block text-2xl font-medium text-text-main py-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    onClick={closeMobileMenu}
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/delivery" 
                    className="block text-2xl font-medium text-text-main py-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    onClick={closeMobileMenu}
                  >
                    Доставка
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/returns" 
                    className="block text-2xl font-medium text-text-main py-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    onClick={closeMobileMenu}
                  >
                    Обмін та повернення
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/favorites" 
                    className="block text-2xl font-medium text-text-main py-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    onClick={closeMobileMenu}
                  >
                    Обране
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/account" 
                    className="block text-2xl font-medium text-text-main py-2"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    onClick={closeMobileMenu}
                  >
                    Профіль
                  </Link>
                </li>
              </ul>
            </nav>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link 
                to="/auth" 
                className="block w-full text-center py-3 border border-black text-black font-medium uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                onClick={closeMobileMenu}
              >
                {session ? 'Вийти' : 'Увійти'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}