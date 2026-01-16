import ProductCard from '@/components/catalog/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/SkeletonLoader';
import { useFrequentlyBought } from '@/hooks/useFrequentlyBought';

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
      <h2
        className="text-2xl font-light mb-6 uppercase tracking-[2px]"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Часто купують разом
      </h2>

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

