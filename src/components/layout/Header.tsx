import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, User, ShoppingBag, Menu, X, Loader2 } from 'lucide-react';
import { useCartStore, useCartTotalItems } from '../../store/cartStore';
import { useUserStore } from '../../features/auth/useUserStore';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import MegaDropdown from './MegaDropdown';

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
              <MegaDropdown label="Каталог" to="/catalog" />
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
                Осінній догляд
              </Link>
              <Link 
                to="/faq" 
                className="text-text-main hover:opacity-70 transition text-sm xl:text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                FAQ
              </Link>
              <Link 
                to="/contacts" 
                className="text-text-main hover:opacity-70 transition text-sm xl:text-base"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Контакти
              </Link>
            </nav>

            {/* Right Side: Icons Only (Mobile & Desktop) */}
            <div className="absolute right-0 flex items-center space-x-2 md:space-x-4">
              {/* Icons */}
              <div className="flex items-center space-x-2 md:space-x-4">
              {/* Search Icon */}
              <button
                onClick={handleSearchIconClick}
                className="text-text-main hover:opacity-70 transition"
                aria-label="Search"
              >
                <Search size={18} className="md:w-5 md:h-5" />
              </button>

              {/* Favorites with conditional tooltip */}
              <div className="relative">
                {session ? (
                  <Link to="/favorites" className="text-text-main hover:opacity-70 transition">
                    <Heart size={18} className="md:w-5 md:h-5" />
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={handleHeartClick}
                      className="text-text-main hover:opacity-70 transition"
                    >
                      <Heart size={18} className="md:w-5 md:h-5" />
                    </button>
                    {showFavoritesTooltip && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50">
                        <p className="text-xs md:text-sm text-text-main" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Створіть або{' '}
                          <Link
                            to="/auth"
                            className="underline hover:opacity-70"
                            onClick={() => setShowFavoritesTooltip(false)}
                          >
                            увійдіть
                          </Link>
                          {' '}в акаунт, щоб додати у список бажань
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* User Account */}
              {session ? (
                <Link to="/account" className="text-text-main hover:opacity-70 transition">
                  <User size={18} className="md:w-5 md:h-5" />
                </Link>
              ) : (
                <Link to="/auth" className="text-text-main hover:opacity-70 transition">
                  <User size={18} className="md:w-5 md:h-5" />
                </Link>
              )}

              {/* Cart with Badge */}
              <button 
                onClick={toggleCart}
                className="text-text-main hover:opacity-70 transition relative"
                id="cart-button"
              >
                <ShoppingBag size={18} className="md:w-5 md:h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-red-500 text-white text-[10px] md:text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center font-bold">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
              </div>

              {/* Mobile Menu Toggle - Animated Hamburger */}
              <button
                className="lg:hidden text-text-main hover:opacity-70 transition relative w-6 h-6 flex flex-col justify-center items-center gap-1.5 ml-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span
                  className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                  }`}
                />
                <span
                  className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Banner - Under Navigation */}
      <div className="bg-[rgba(255,200,140,0.75)] py-1.5 md:py-2">
        <div className="container mx-auto px-3 md:px-4">
          <p 
            className="text-center text-[10px] sm:text-xs md:text-sm font-medium uppercase tracking-[0.5px] md:tracking-[1px] leading-tight"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ЗАМОВЛЯЙТЕ ВІД 4000 ГРН - ОТРИМУЙТЕ БЕЗКОШТОВНУ ДОСТАВКУ
          </p>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 md:pt-32">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
          />
          
          {/* Search Modal Content */}
          <div
            ref={searchContainerRef}
            className="relative w-full max-w-2xl mx-4 bg-white rounded-lg shadow-2xl"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                <Search className="text-gray-400" size={24} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Пошук товарів..."
                  className="flex-1 bg-transparent py-2 focus:outline-none text-text-main placeholder-gray-500 text-lg"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                  aria-label="Close search"
                >
                  <X size={24} />
                </button>
              </form>
            </div>
            
            {/* Search Results */}
            {showSearchResults && (
              <div 
                ref={searchResultsRef}
                className="max-h-96 overflow-y-auto"
              >
                {isSearchLoading ? (
                  <div className="p-8 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-3 text-sm text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Пошук...
                    </span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((product, index) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className={`w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left ${
                          index === selectedIndex ? 'bg-gray-50' : ''
                        }`}
                      >
                        <img
                          src={product.images?.[0] || '/placeholder-product.jpg'}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-900 truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {product.name}
                          </p>
                          <p className="text-base font-semibold text-gray-700 mt-1">
                            {Number(product.price).toLocaleString('uk-UA')} ₴
                          </p>
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-gray-200 px-6 py-4">
                      <button
                        onClick={handleSearch}
                        className="w-full text-center text-base font-medium text-gray-700 hover:text-gray-900 py-3 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Показати всі результати для "{searchQuery}"
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Товари не знайдені
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={closeMobileMenu}
        />
        
        {/* Menu Panel */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
          <div className="p-6">
            {/* Close Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={closeMobileMenu}
                className="text-text-main hover:opacity-70 transition"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col space-y-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <Link 
                to="/catalog" 
                className="text-text-main hover:opacity-70 transition py-3 border-b border-gray-100 text-base font-medium" 
                onClick={closeMobileMenu}
              >
                Каталог
              </Link>
              <Link 
                to="/about" 
                className="text-text-main hover:opacity-70 transition py-3 border-b border-gray-100 text-base font-medium" 
                onClick={closeMobileMenu}
              >
                Про бренд
              </Link>
              <Link 
                to="/skincare-regimen" 
                className="text-text-main hover:opacity-70 transition py-3 border-b border-gray-100 text-base font-medium" 
                onClick={closeMobileMenu}
              >
                Режим догляду за шкірою
              </Link>
              <Link 
                to="/autumn-care" 
                className="text-text-main hover:opacity-70 transition py-3 border-b border-gray-100 text-base font-medium" 
                onClick={closeMobileMenu}
              >
                Осінній догляд
              </Link>
              <Link 
                to="/faq" 
                className="text-text-main hover:opacity-70 transition py-3 border-b border-gray-100 text-base font-medium" 
                onClick={closeMobileMenu}
              >
                FAQ
              </Link>
              <Link 
                to="/contacts" 
                className="text-text-main hover:opacity-70 transition py-3 border-b border-gray-100 text-base font-medium" 
                onClick={closeMobileMenu}
              >
                Контакти
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
