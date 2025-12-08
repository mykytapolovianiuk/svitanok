import { useCartStore } from '@/store/cartStore';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAnalytics, formatCartItemsForAnalytics } from '@/hooks/useAnalytics';
import { usePromoCode, usePromoCodeDiscount } from '@/hooks/usePromoCode';

const FREE_SHIPPING_THRESHOLD = 4000;
const SHIPPING_COST = 150;

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCartStore();
  const [promoCode, setPromoCode] = useState('');
  const { trackViewCart, trackRemoveFromCart } = useAnalytics();
  const { appliedCode, applyCode, removeCode, isLoading: promoLoading } = usePromoCode();
  const { discountAmount, finalTotal: subtotal } = usePromoCodeDiscount(totalPrice);

  // Розрахунок вартості доставки
  const shippingCost = useMemo(() => {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  }, [subtotal]);

  const finalTotal = useMemo(() => {
    return subtotal + shippingCost;
  }, [subtotal, shippingCost]);

  // Track view cart when component mounts
  useEffect(() => {
    if (items.length > 0) {
      const analyticsItems = formatCartItemsForAnalytics(items);
      trackViewCart(analyticsItems, totalPrice);
    }
  }, []); // Only on mount

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    await applyCode(promoCode.trim(), totalPrice);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF2E1] py-8">
        <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
          <h1 
            className="text-2xl font-light mb-8 text-center uppercase tracking-[2px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            КОШИК
          </h1>
          <div className="bg-white rounded-sm border border-black p-8 text-center">
            <svg className="mx-auto h-32 w-32 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 
              className="mt-6 text-xl font-light text-black uppercase tracking-[2px]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Ваш кошик порожній
            </h3>
            <p 
              className="mt-2 text-gray-500 font-light"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Додайте товари до кошика
            </p>
            <div className="mt-8">
              <Link
                to="/catalog"
                className="inline-flex items-center px-8 py-4 border border-black text-base font-medium text-black bg-white hover:bg-black hover:text-white transition-colors duration-300 rounded-none"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Почати покупки
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF2E1]">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px] py-8">
        <h1 
          className="text-2xl font-light mb-8 text-center uppercase tracking-[2px]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          КОШИК
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-[#FAF4EB] p-6 md:p-[60px_40px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="bg-white rounded-sm border border-black p-6 relative">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 border border-black overflow-hidden">
                      <img 
                        src={item.product.images[0] || '/placeholder-product.jpg'} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 
                        className="font-medium text-sm uppercase tracking-[0.5px] mb-1 line-clamp-2"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {item.product.name}
                      </h3>
                      <p 
                        className="text-black font-medium text-base mb-3"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {item.product.price.toFixed(2)} ₴
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        trackRemoveFromCart({
                          id: item.product.id,
                          name: item.product.name,
                          price: item.product.price,
                          quantity: item.quantity,
                        });
                        removeItem(item.product.id);
                      }}
                      className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="flex justify-center mt-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-[#FBE3C8] border border-[rgba(226,201,174,0.5)] hover:opacity-90 text-lg font-light text-black"
                      >
                        <Minus size={16} />
                      </button>
                      <span 
                        className="text-base font-medium"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-[#FBE3C8] border border-[rgba(226,201,174,0.5)] hover:opacity-90 text-lg font-light text-black"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 bg-[#FAF4EB] p-6 md:p-[60px_40px] lg:sticky lg:top-0 h-fit lg:h-screen lg:overflow-y-auto">
            <h2 
              className="text-xl font-light mb-6 uppercase tracking-[2px] border-b border-black pb-4"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Разом
            </h2>
            
            {/* Promo Code */}
            <div className="mb-6">
              {appliedCode ? (
                <div className="border border-black bg-black p-3 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {appliedCode.code}
                      </span>
                      <span className="text-xs text-white font-bold">
                        -{appliedCode.discount_type === 'percentage' ? `${appliedCode.discount_value}%` : `${appliedCode.discount_value} ₴`}
                      </span>
                    </div>
                    <button
                      onClick={removeCode}
                      className="text-white hover:opacity-70 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="ПРОМОКОД"
                    className="flex-1 border border-[rgba(226,201,174,0.5)] py-3 px-4 bg-white focus:outline-none"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    disabled={promoLoading}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-4 bg-black text-white hover:opacity-90 transition-opacity text-xs font-bold uppercase tracking-[2px] disabled:opacity-50"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {promoLoading ? '...' : 'ЗАСТОСУВАТИ'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span 
                  className="text-sm uppercase tracking-[1px] font-medium"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  СУМА:
                </span>
                <span 
                  className="text-sm uppercase tracking-[1px] font-medium"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {totalPrice.toFixed(2)} ₴
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-black">
                  <span 
                    className="text-sm uppercase tracking-[1px] font-medium"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    ЗНИЖКА:
                  </span>
                  <span 
                    className="text-sm uppercase tracking-[1px] font-medium font-bold"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    -{discountAmount.toFixed(2)} ₴
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span 
                  className="text-sm uppercase tracking-[1px] font-medium"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  ПІДСУМОК:
                </span>
                <span 
                  className="text-sm uppercase tracking-[1px] font-medium"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {subtotal.toFixed(2)} ₴
                </span>
              </div>
              <div className="flex justify-between">
                <span 
                  className="text-sm uppercase tracking-[1px] font-medium"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  ДОСТАВКА:
                </span>
                <span 
                  className={`text-sm uppercase tracking-[1px] font-medium ${shippingCost === 0 ? 'text-black font-bold' : ''}`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {shippingCost === 0 ? 'БЕЗКОШТОВНО' : `${shippingCost.toFixed(2)} ₴`}
                </span>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <div className="p-2 bg-[#FAF4EB] border border-black rounded text-xs text-black text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Додайте товарів на {(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} ₴ для безкоштовної доставки
                </div>
              )}
              {subtotal >= FREE_SHIPPING_THRESHOLD && (
                <div className="p-2 bg-black border border-black rounded text-xs text-white text-center font-medium uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  ✓ Безкоштовна доставка активована!
                </div>
              )}
              <div className="flex justify-between border-t border-black pt-2">
                <span 
                  className="text-2xl font-light uppercase tracking-[1px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  ЗАГАЛЬНА СУМА ЗАМОВЛЕННЯ:
                </span>
                <span 
                  className="text-2xl font-light uppercase tracking-[1px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {finalTotal.toFixed(2)} ₴
                </span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="block w-full bg-black text-white text-center py-6 text-sm font-bold uppercase tracking-[2px] hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              ОФОРМИТИ ЗАМОВЛЕННЯ
            </Link>
            <button
              onClick={clearCart}
              className="block w-full mt-3 text-xs underline text-center"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Очистити кошик
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}