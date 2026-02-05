import { useEffect, useState } from 'react';
import { X, ShoppingBag, Tag, XCircle } from 'lucide-react';
import { useCartStore, useCartTotalPrice, useCartTotalItems } from '@/store/cartStore';
import { Link, useNavigate } from 'react-router-dom';
import CartItem from '@/components/cart/CartItem';
import { usePromoCode, usePromoCodeDiscount } from '@/hooks/usePromoCode';
import ShippingProgressBar from './ShippingProgressBar';
import CartUpsell from './CartUpsell';

const FREE_SHIPPING_THRESHOLD = 4000;

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    clearCart
  } = useCartStore();
  const totalPrice = useCartTotalPrice();
  const totalItems = useCartTotalItems();
  const { appliedCode, applyCode, removeCode, isLoading: promoLoading } = usePromoCode();
  const { discountAmount, finalTotal: subtotal } = usePromoCodeDiscount(totalPrice);
  const [promoInput, setPromoInput] = useState('');

  const navigate = useNavigate();



  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const cartElement = document.getElementById('cart-drawer');
      const cartButton = document.getElementById('cart-button');

      if (
        isOpen &&
        cartElement &&
        !cartElement.contains(e.target as Node) &&
        cartButton &&
        !cartButton.contains(e.target as Node)
      ) {
        closeCart();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeCart]);

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleStartShopping = () => {
    closeCart();
    navigate('/catalog');
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    const success = await applyCode(promoInput.trim(), totalPrice);
    if (success) {
      setPromoInput('');
    }
  };

  const handleRemovePromo = () => {
    removeCode();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      {/* Drawer */}
      <div
        id="cart-drawer"
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#FAF4EB] shadow-xl transform transition-transform duration-300 ease-in-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2
            className="text-xl font-light uppercase tracking-[2px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            КОШИК
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col h-full">
          {items.length > 0 && subtotal >= 0 && (
            <ShippingProgressBar total={subtotal} threshold={FREE_SHIPPING_THRESHOLD} />
          )}
          <div className="flex-1 overflow-y-auto p-4 py-2">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag size={32} className="text-gray-400" />
                </div>
                <p
                  className="text-gray-600 mb-6"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Ваш кошик порожній :(
                </p>
                <button
                  onClick={handleStartShopping}
                  className="px-6 py-3 bg-black text-white rounded hover:opacity-90 transition text-sm font-bold uppercase tracking-[2px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Почати покупки
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {items.map(({ product, quantity }) => (
                    <CartItem
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      price={product.price}
                      image={product.images[0] || ''}
                      quantity={quantity}
                    />
                  ))}
                </div>

                {/* Promo Code Section */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  {appliedCode ? (
                    <div className="flex items-center justify-between p-3 bg-black border border-black rounded">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-white" />
                        <span className="text-sm font-medium text-white uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {appliedCode.code}
                        </span>
                        {appliedCode.discount_type === 'percentage' ? (
                          <span className="text-xs text-white font-bold">-{appliedCode.discount_value}%</span>
                        ) : (
                          <span className="text-xs text-white font-bold">-{appliedCode.discount_value} ₴</span>
                        )}
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="p-1 hover:opacity-70 rounded transition-opacity"
                        title="Видалити промокод"
                      >
                        <XCircle className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                          placeholder="Промокод"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                          disabled={promoLoading}
                        />
                        <button
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoInput.trim()}
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {promoLoading ? '...' : 'Застосувати'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upsell Block */}
                <CartUpsell items={items} />

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {/* Discount Badge */}
                  {appliedCode && discountAmount > 0 && (
                    <div className="mb-3 p-2 bg-black border border-black rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-white" />
                          <span
                            className="text-xs font-bold text-white uppercase tracking-[1px]"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            Діє знижка
                          </span>
                          {appliedCode.discount_type === 'percentage' ? (
                            <span
                              className="text-xs font-bold text-white"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              -{appliedCode.discount_value}%
                            </span>
                          ) : (
                            <span
                              className="text-xs font-bold text-white"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              -{appliedCode.discount_value.toFixed(2)} ₴
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className="text-sm uppercase tracking-[1px] font-medium text-gray-600"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Знижка:
                      </span>
                      <span
                        className="text-sm font-medium text-black font-bold"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        -{discountAmount.toFixed(2)} ₴
                      </span>
                    </div>
                  )}


                  <div className="flex justify-between items-center mb-4 pt-2 border-t border-gray-200">
                    <span
                      className="text-base uppercase tracking-[1px] font-medium"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      ВСЬОГО:
                    </span>
                    <span
                      className="text-base font-medium"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {subtotal.toFixed(2)} ₴
                    </span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-black text-white py-4 rounded hover:opacity-90 transition text-sm font-bold uppercase tracking-[2px]"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    ОФОРМИТИ ЗАМОВЛЕННЯ
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full mt-3 text-xs underline text-center"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Очистити кошик
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}