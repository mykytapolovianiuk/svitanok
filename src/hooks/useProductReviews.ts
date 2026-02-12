import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Types
export interface Review {
  id: number;
  product_id: number;
  user_id: string | null;
  user_name: string;
  rating: number;
  comment?: string;
  pros?: string;
  cons?: string;
  images?: string[];
  admin_reply?: string;
  created_at: string;
  is_approved: boolean;
  // Augmented fields
  likes_count?: number;
  dislikes_count?: number;
  user_vote?: 'like' | 'dislike' | null;
  replies?: ReviewComment[];
}

export interface Question {
  id: number;
  product_id: number;
  user_id: string | null;
  user_name: string;
  question: string;
  answer?: string;
  created_at: string;
  is_approved: boolean;
}

export interface ReviewComment {
  id: number;
  review_id: number;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  is_approved: boolean;
  parent_id?: number | null;
}

interface AddReviewParams {
  productId: string | number;
  userName: string;
  rating: number;
  comment?: string;
  pros?: string;
  cons?: string;
  images?: File[];
  userId?: string;
}

interface AddQuestionParams {
  productId: string | number;
  userName: string;
  question: string;
  userId?: string;
}

interface AddReplyParams {
  reviewId: number;
  content: string;
  userName: string;
  userId: string;
  parentId?: number;
}

interface VoteParams {
  reviewId: number;
  voteType: 'like' | 'dislike';
  userId: string;
}


export function useProductReviews(productIdInput: number | string) {
  const queryClient = useQueryClient();
  const productId = Number(productIdInput);

  // Keys
  const reviewsKey = ['product-reviews', productId];
  const questionsKey = ['product-questions', productId];

  // --- REVIEWS QUERY ---
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: reviewsKey,
    queryFn: async () => {
      // 1. Fetch approved reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // 2. Fetch votes, comments for these reviews
      // Note: In a real large app, you'd load these on demand or use a view/joined query.
      // For now, we'll do client-side augmentation for simplicity.

      const enrichedReviews = await Promise.all(reviewsData.map(async (review) => {
        // Fetch votes count
        const { data: votes } = await supabase
          .from('review_votes')
          .select('vote_type, user_id')
          .eq('review_id', review.id);

        const likes = votes?.filter(v => v.vote_type === 'like').length || 0;
        const dislikes = votes?.filter(v => v.vote_type === 'dislike').length || 0;

        // Check current user vote (we need session for this, but hooks run on client)
        const { data: { session } } = await supabase.auth.getSession();
        const userVote = votes?.find(v => v.user_id === session?.user?.id)?.vote_type || null;

        // Fetch comments (replies)
        const { data: comments } = await supabase
          .from('review_comments')
          .select('*')
          .eq('review_id', review.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: true });

        return {
          ...review,
          likes_count: likes,
          dislikes_count: dislikes,
          user_vote: userVote,
          replies: comments || []
        } as Review;
      }));

      return enrichedReviews;
    },
  });

  // --- QUESTIONS QUERY ---
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: questionsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_questions')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true) // Only approved
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Question[];
    }
  });


  // --- MUTATIONS ---

  // 1. Add Review
  const addReview = useMutation({
    mutationFn: async (params: AddReviewParams) => {
      const { productId, userName, rating, comment, pros, cons, images, userId } = params;
      let imageUrls: string[] = [];

      if (images && images.length > 0) {
        // Upload logic
        for (const file of images) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId || 'guest'}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('review-images').upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('review-images').getPublicUrl(fileName);
          imageUrls.push(publicUrl);
        }
      }

      const { error } = await supabase.from('reviews').insert([{
        product_id: productId,
        user_name: userName,
        rating,
        comment: comment || null,
        pros: pros || null,
        cons: cons || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        user_id: userId || null,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewsKey });
    }
  });

  // 2. Add Question
  const addQuestion = useMutation({
    mutationFn: async (params: AddQuestionParams) => {
      const { error } = await supabase.from('product_questions').insert([{
        product_id: params.productId,
        user_name: params.userName,
        question: params.question,
        user_id: params.userId || null,
        is_approved: true // Auto-approve questions per user request
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionsKey });
    }
  });

  // 3. Vote (Like/Dislike)
  const voteReview = useMutation({
    mutationFn: async ({ reviewId, voteType, userId }: VoteParams) => {
      // Check if already voted
      const { data: existing } = await supabase
        .from('review_votes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        if (existing.vote_type === voteType) {
          // Toggle off (remove vote)
          await supabase.from('review_votes').delete().eq('id', existing.id);
        } else {
          // Change vote
          await supabase.from('review_votes').update({ vote_type: voteType }).eq('id', existing.id);
        }
      } else {
        // New vote
        await supabase.from('review_votes').insert([{
          review_id: reviewId,
          user_id: userId,
          vote_type: voteType
        }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewsKey });
    }
  });

  // 4. Reply to Review
  const replyToReview = useMutation({
    mutationFn: async (params: AddReplyParams) => {
      const { error } = await supabase.from('review_comments').insert([{
        review_id: params.reviewId,
        user_id: params.userId,
        user_name: params.userName,
        content: params.content,
        parent_id: params.parentId || null
      }]);

      if (error) throw error;

      // Notify original author (if not self) -> Implementation omitted for now, requires lookup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewsKey });
    }
  });

  return {
    reviews,
    questions,
    isLoading: isLoadingReviews || isLoadingQuestions,
    addReview,
    addQuestion,
    voteReview,
    replyToReview
  };
}
