import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Spinner from '../ui/Spinner';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string | number;
    name: string;
    price: number;
  };
}

export default function QuickOrderModal({ isOpen, onClose, product }: QuickOrderModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast.error('Будь ласка, заповніть всі поля');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const orderData = {
        status: 'pending',
        delivery_method: 'quick_order',
        payment_method: 'on_receipt',
        total_price: product.price,
        customer_name: name,
        customer_phone: phone,
      };
      
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
        
      if (orderError) throw orderError;
      
      const orderItemData = {
        order_id: orderResult.id,
        product_id: product.id.toString(),
        quantity: 1,
        price_at_purchase: product.price,
      };
      
      const { error: itemError } = await supabase
        .from('order_items')
        .insert(orderItemData);
        
      if (itemError) throw itemError;
      
      // Production logging removed
      
      toast.success('Замовлення успішно оформлено! Очікуйте дзвінка.');
      setName('');
      setPhone('');
      onClose();
    } catch (error) {
      console.error('Quick order error:', error);
      toast.error('Помилка при оформленні замовлення. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-none border border-black shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black">
          <h2
            className="text-xl font-medium uppercase tracking-[2px]"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Швидке замовлення
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Product Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 
            className="font-medium text-base mb-2 uppercase tracking-wide"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {product.name}
          </h3>
          <p 
            className="text-lg font-semibold"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {product.price.toFixed(2)} ₴
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label 
                htmlFor="quick-order-name" 
                className="block text-sm font-medium mb-2 uppercase tracking-[1px]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Ім'я *
              </label>
              <input
                type="text"
                id="quick-order-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-b border-gray-300 py-2 px-0 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                placeholder="Ваше ім'я"
                required
              />
            </div>
            
            <div>
              <label 
                htmlFor="quick-order-phone" 
                className="block text-sm font-medium mb-2 uppercase tracking-[1px]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Телефон *
              </label>
              <input
                type="tel"
                id="quick-order-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent border-b border-gray-300 py-2 px-0 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
                placeholder="+380XXXXXXXXX"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-8 bg-black text-white py-4 text-sm font-bold uppercase tracking-[2px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {isSubmitting && <Spinner size="sm" className="text-white" />}
            {isSubmitting ? 'Обробка...' : 'Чекаю дзвінка'}
          </button>
        </form>
      </div>
    </div>
  );
}