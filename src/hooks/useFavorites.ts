import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '../features/auth/useUserStore';


export function useFavorites() {
  const { session } = useUserStore();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  
  
  const { data: favoriteIds, isLoading } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return new Set<number>();
      
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (error) throw error;

      
      return new Set(data?.map(fav => fav.product_id) || []);
    },
    enabled: !!userId, 
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
    
    placeholderData: new Set<number>(),
  });

  
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!userId) throw new Error('User not authenticated');

      const isCurrentlyFavorite = (favoriteIds || new Set<number>()).has(productId);
      
      if (isCurrentlyFavorite) {
        
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: userId, product_id: productId });

        if (error) throw error;
      } else {
        
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, product_id: productId });

        if (error) throw error;
      }
      
      return !isCurrentlyFavorite;
    },
    onSuccess: () => {
      
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

  
  const safeFavoriteIds = favoriteIds || new Set<number>();

  return {
    favorites: Array.from(safeFavoriteIds), 
    favoriteIds: safeFavoriteIds, 
    loading: isLoading,
    toggleFavorite,
    isFavorite,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['favorites', userId] }),
  };
}