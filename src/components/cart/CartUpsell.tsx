import { Link } from 'react-router-dom';
import { useFrequentlyBought } from '@/hooks/useFrequentlyBought';
import { useCartStore } from '@/store/cartStore';

interface CartUpsellProps {
    items: any[]; // Cart items from store
}

export default function CartUpsell({ items }: CartUpsellProps) {
    // Use the first item in the cart as the trigger for recommendations
    // If cart is empty, we don't show recommendations (or could show generic popular ones)
    const triggerProductId = items.length > 0 ? items[0].product.id : 0;

    const { products, loading } = useFrequentlyBought(triggerProductId);
    const { addItem } = useCartStore();

    if (loading || !products || products.length === 0) return null;

    // Filter out products already in cart
    const cartProductIds = new Set(items.map(item => item.product.id));
    const upsellProducts = products.filter(p => !cartProductIds.has(p.id));

    if (upsellProducts.length === 0) return null;

    return (
        <div className="mt-6 pt-6 border-t border-gray-200">
            <h3
                className="text-sm font-medium uppercase tracking-[1px] mb-4"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
                Часто купують разом
            </h3>

            <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
                {upsellProducts.slice(0, 4).map((product) => (
                    <div
                        key={product.id}
                        className="flex-shrink-0 w-32 group"
                    >
                        <Link to={`/product/${product.slug}`} className="block relative aspect-[3/4] mb-2 bg-gray-100 overflow-hidden rounded-sm">
                            {product.images && product.images[0] ? (
                                <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                    No Img
                                </div>
                            )}
                        </Link>

                        <div className="space-y-1">
                            <Link to={`/product/${product.slug}`}>
                                <h4
                                    className="text-xs font-medium text-gray-900 line-clamp-2 min-h-[2.5em] leading-tight hover:underline"
                                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                                >
                                    {product.name}
                                </h4>
                            </Link>

                            <p className="text-xs font-bold">{product.price} ₴</p>

                            <button
                                onClick={() => addItem(product)}
                                className="w-full mt-2 py-1.5 bg-white border border-black text-black text-[10px] uppercase font-bold tracking-wider hover:bg-black hover:text-white transition-colors"
                            >
                                Додати
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
