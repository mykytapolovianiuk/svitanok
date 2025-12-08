import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import ProductCard from '@/components/catalog/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/SkeletonLoader';
import { ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFrequentlyBought } from '@/hooks/useFrequentlyBought';
import Spinner from '@/components/ui/Spinner';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  images: string[];
  attributes: Record<string, any>;
  description: string;
  in_stock: boolean;
}

interface FrequentlyBoughtTogetherProps {
  productId: number;
}

export default function FrequentlyBoughtTogether({ productId }: FrequentlyBoughtTogetherProps) {
  const { products, loading } = useFrequentlyBought(productId);
  const { addItem } = useCartStore();
  const [addingAll, setAddingAll] = useState(false);

  const handleAddAll = async () => {
    if (products.length === 0) return;

    setAddingAll(true);
    try {
      let addedCount = 0;
      for (const product of products) {
        if (product.in_stock) {
          addItem(product);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        toast.success(`${addedCount} товарів додано до кошика!`);
      } else {
        toast.error('Немає товарів в наявності');
      }
    } catch (error) {
      console.error('Error adding products to cart:', error);
      toast.error('Помилка додавання товарів');
    } finally {
      setAddingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-16">
        <h2
          className="text-2xl font-light mb-6 uppercase tracking-[2px]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Часто купують разом
        </h2>
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2
          className="text-2xl font-light uppercase tracking-[2px]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Часто купують разом
        </h2>
        <button
          onClick={handleAddAll}
          disabled={addingAll || products.every((p) => !p.in_stock)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[1px] text-sm font-medium"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {addingAll ? (
            <>
              <Spinner size="sm" className="text-white" />
              <span>Додавання...</span>
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              <span>Додати все до кошика</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            slug={product.slug}
            price={product.price}
            oldPrice={product.old_price}
            image={product.images[0] || ''}
            rating={4}
          />
        ))}
      </div>
    </div>
  );
}

