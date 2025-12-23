import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useFavorites } from '../../hooks/useFavorites';
import { useCartStore } from '../../store/cartStore';
import { useAnalytics } from '../../hooks/useAnalytics';
import { toast } from 'react-hot-toast';
import Spinner from '../ui/Spinner';
import { getOptimizedImageUrl, getImageSrcSet } from '../../utils/imageHelpers';

interface ProductCardProps {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  rating?: number;
  description?: string;
}

export default function ProductCard({ 
  id, 
  name, 
  slug, 
  price, 
  oldPrice, 
  image, 
  rating = 0,
  description
}: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Керування обраним (вибране/не вибране)
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // Додавання товару в кошик
  const { addItem } = useCartStore();
  
  // Відстеження аналітики
  const { trackAddToCart, trackFavorite, trackSelectItem } = useAnalytics();

  // Додавання товару в кошик з повідомленням
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    try {
      // Створюємо об'єкт товару з необхідними властивостями
      const product = {
        id,
        name,
        slug,
        price,
        old_price: oldPrice ?? null,
        images: [image],
        attributes: {},
        description: '',
        in_stock: true
      };
      
      addItem(product);
      
      // Відстежуємо додавання в кошик
      trackAddToCart({
        id,
        name,
        price,
        quantity: 1,
      });
      
      // Показуємо повідомлення лише при додаванні в кошик, не для обраних
      toast.success('Товар додано до кошика!');
    } finally {
      // Невелика затримка для кращого UX
      setTimeout(() => setIsAddingToCart(false), 300);
    }
  };

  // Перемикач для обраного статусу товару
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasFavorite = isFavorite(id);
    toggleFavorite(id);
    
    // Відстежуємо дію з обраним
    trackFavorite(wasFavorite ? 'remove' : 'add', id);
    
    // Показуємо відповідне повідомлення залежно від дії
    if (wasFavorite) {
      toast.success('Товар видалено з обраних');
    } else {
      toast.success('Товар додано в улюблені');
    }
  };
  
  // Відстежуємо вибір товару при кліку на картку товару
  const handleProductClick = () => {
    trackSelectItem({
      item_id: String(id),
      item_name: name,
      price: price,
      currency: 'UAH',
    }, 'catalog', 'Каталог товарів');
  };

  return (
    <div className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link to={`/product/${encodeURIComponent(slug)}`} className="block" onClick={handleProductClick}>
        {/* Image Container */}
        <div className="relative bg-[#F5F5F5] aspect-[3/4] overflow-hidden">
          {/* Heart Icon */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 left-3 z-10 p-1.5 hover:bg-gray-100 transition-colors"
          >
            <Heart
              size={16}
              className={`${isFavorite(id) ? 'fill-black stroke-black' : 'stroke-black'} transition-colors`}
            />
          </button>

          {/* Image with WebP support */}
          <picture>
            <source
              srcSet={image ? getImageSrcSet(image) : undefined}
              type="image/webp"
            />
            <img
              src={image ? getOptimizedImageUrl(image, 300, 80) : '/placeholder-product.jpg'}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>

        {/* Content */}
        <div className="pt-4">
          {/* Title */}
          <h3
            className="text-xs font-medium uppercase text-center underline underline-offset-4 mb-2 line-clamp-2 min-h-[40px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {name}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-[10px] text-gray-500 text-center line-clamp-2 mb-3 min-h-[30px]">
              {description}
            </p>
          )}

          {/* Price */}
          <div className="text-center mb-3">
            <span
              className="text-lg font-medium"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {price.toLocaleString('uk-UA')} ₴
            </span>
          </div>

          {/* Rating */}
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <span 
                key={i} 
                className={`text-xs ${i < rating ? 'text-black' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Action Button */}
      <button
        className="w-full border border-black py-3 text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}
        onClick={handleAddToCart}
        disabled={isAddingToCart}
      >
        {isAddingToCart && <Spinner size="sm" />}
        {isAddingToCart ? 'Додавання...' : 'КУПИТИ'}
      </button>
    </div>
  );
}