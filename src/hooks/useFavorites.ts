import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '../features/auth/useUserStore';

/**
 * Оптимізований hook для роботи з обраними товарами
 * Використовує React Query для кешування та дедуплікації запитів
 * Вирішує N+1 проблему - один запит замість тисяч
 */
export function useFavorites() {
  const { session } = useUserStore();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  // Один запит для всіх обраних товарів користувача
  // React Query автоматично кешує та дедуплікує запити
  const { data: favoriteIds, isLoading } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return new Set<number>();
      
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (error) throw error;

      // Повертаємо Set для швидкої перевірки O(1)
      return new Set(data?.map(fav => fav.product_id) || []);
    },
    enabled: !!userId, // Запит виконується тільки якщо є userId
    staleTime: 5 * 60 * 1000, // Дані вважаються свіжими 5 хвилин
    gcTime: 10 * 60 * 1000, // Кеш зберігається 10 хвилин
    // Повертаємо порожній Set якщо дані ще не завантажені
    placeholderData: new Set<number>(),
  });

  // Mutation для додавання/видалення обраного товару
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!userId) throw new Error('User not authenticated');

      const isCurrentlyFavorite = (favoriteIds || new Set<number>()).has(productId);
      
      if (isCurrentlyFavorite) {
        // Видалити з обраних
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: userId, product_id: productId });

        if (error) throw error;
      } else {
        // Додати до обраних
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, product_id: productId });

        if (error) throw error;
      }
      
      return !isCurrentlyFavorite;
    },
    onSuccess: () => {
      // Оновити кеш після успішної мутації
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  const toggleFavorite = async (productId: number) => {
    if (!userId) return false;
    
    try {
      await toggleFavoriteMutation.mutateAsync(productId);
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  };

  const isFavorite = (productId: number) => {
    if (!favoriteIds) return false;
    return favoriteIds.has(productId);
  };

  // Завжди повертаємо Set, навіть якщо дані ще завантажуються
  const safeFavoriteIds = favoriteIds || new Set<number>();

  return {
    favorites: Array.from(safeFavoriteIds), // Для зворотної сумісності
    favoriteIds: safeFavoriteIds, // Set для швидкої перевірки
    loading: isLoading,
    toggleFavorite,
    isFavorite,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['favorites', userId] }),
  };
}