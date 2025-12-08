import { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

interface CartItemProps {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
}

export default function CartItem({
  id,
  name,
  slug,
  price,
  image,
  quantity,
}: CartItemProps) {
  const [itemQuantity, setItemQuantity] = useState(quantity);
  const { updateQuantity, removeItem } = useCartStore();

  const handleQuantityChange = (value: number) => {
    if (value < 1) {
      removeItem(id);
      return;
    }
    if (value > 99) return;
    
    setItemQuantity(value);
    updateQuantity(id, value);
  };

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200 relative">
      {/* Image */}
      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded overflow-hidden border border-black">
        <img
          src={image || '/placeholder-product.jpg'}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3
          className="font-medium text-sm uppercase tracking-[0.5px] mb-1 line-clamp-2"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          <a href={`/product/${encodeURIComponent(slug)}`} className="hover:text-gray-600">
            {name}
          </a>
        </h3>

        {/* Price */}
        <p
          className="text-base font-medium mb-3"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {price.toFixed(2)} ₴
        </p>

        {/* Quantity Controls - Centered below name+price */}
        <div className="flex justify-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleQuantityChange(itemQuantity - 1)}
              className="w-8 h-8 flex items-center justify-center bg-[#FBE3C8] border border-[rgba(226,201,174,0.5)] hover:opacity-90 text-lg font-light text-black"
            >
              <Minus size={16} />
            </button>
            <span
              className="text-base font-medium"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {itemQuantity}
            </span>
            <button
              onClick={() => handleQuantityChange(itemQuantity + 1)}
              className="w-8 h-8 flex items-center justify-center bg-[#FBE3C8] border border-[rgba(226,201,174,0.5)] hover:opacity-90 text-lg font-light text-black"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Remove Button - Top Right */}
      <button
        onClick={() => removeItem(id)}
        className="absolute top-0 right-0 text-gray-500 hover:text-red-500"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}