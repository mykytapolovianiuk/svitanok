import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

// Selectors for computed values
export const useCartTotalPrice = () => {
  const items = useCartStore(state => state.items);
  return calculateTotalPrice(items);
};

export const useCartTotalItems = () => {
  const items = useCartStore(state => state.items);
  return calculateTotalItems(items);
};

// Допоміжні функції для обчислення загальної суми та кількості товарів
const calculateTotalPrice = (items: CartItem[]): number => {
  // Тягнемо загальну суму всіх товарів в кошику
  return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
};

const calculateTotalItems = (items: CartItem[]): number => {
  // Рахуємо загальну кількість товарів
  return items.reduce((total, item) => total + item.quantity, 0);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      // Додавання товару в кошик
      addItem: (product) => {
        const { items } = get();
        const existingItem = items.find(item => item.product.id === product.id);
        
        if (existingItem) {
          // Якщо товар вже є, збільшуємо кількість
          const newItems = items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          set({ items: newItems });
        } else {
          // Якщо нового товару немає, додаємо його
          const newItems = [...items, { product, quantity: 1 }];
          set({ items: newItems });
        }
      },
      
      // Видалення товару з кошика
      removeItem: (productId) => {
        const newItems = get().items.filter(item => item.product.id !== productId);
        set({ items: newItems });
      },
      
      // Оновлення кількості товару
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        
        const newItems = get().items.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        );
        set({ items: newItems });
      },
      
      // Очищення кошика
      clearCart: () => {
        set({ items: [] });
      },
      
      // Перемикання видимості кошика
      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },
      
      // Відкриття кошика
      openCart: () => {
        set({ isOpen: true });
      },
      
      // Закриття кошика
      closeCart: () => {
        set({ isOpen: false });
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
);
