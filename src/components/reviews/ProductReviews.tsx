import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Review } from '../../types';
import { Star, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate as formatDateHelper } from '../../utils/helpers';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Не вдалося завантажити відгуки');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      toast.error('Будь ласка, введіть ваше ім\'я');
      return;
    }
    
    if (rating === 0) {
      toast.error('Будь ласка, оберіть рейтинг');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const reviewData = {
        product_id: productId,
        user_name: userName,
        rating: rating,
        comment: comment || null,
        user_id: session?.user?.id || null
      };
      
      const { error } = await supabase
        .from('reviews')
        .insert([reviewData]);
        
      if (error) throw error;
      
      
      setUserName('');
      setRating(0);
      setComment('');
      
      toast.success('Дякуємо! Відгук з\'явиться після модерації');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Не вдалося надіслати відгук');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateHelper(dateString);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Відгуки покупців</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-t border-gray-200 pt-8">
        <h2 
          className="text-2xl font-light mb-6 uppercase tracking-[2px]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Відгуки покупців
        </h2>
        
        {}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p 
              className="text-gray-500 text-sm"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Ще немає відгуків. Будьте першим!
            </p>
          ) : (
            reviews.map((review) => (
              <div 
                key={review.id} 
                className="bg-white border border-gray-200 p-4 md:p-6"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                      <h3 
                        className="font-medium text-gray-900 text-sm md:text-base"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {review.user_name}
                      </h3>
                      {renderStars(review.rating)}
                    </div>
                    <p 
                      className="text-xs text-gray-500"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>
                
                {review.comment && (
                  <div className="mt-4 text-gray-700 text-sm md:text-base leading-relaxed">
                    <p style={{ fontFamily: 'Montserrat, sans-serif' }}>{review.comment}</p>
                  </div>
                )}
                
                {review.admin_reply && (
                  <div className="mt-4 p-4 bg-gray-50 border-l-4 border-black">
                    <p 
                      className="text-xs font-medium text-gray-900 uppercase tracking-[1px] mb-1"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      Відповідь Svitanok:
                    </p>
                    <p 
                      className="text-sm text-gray-700"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {review.admin_reply}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {}
      <div className="border-t border-gray-200 pt-8">
        <h3 
          className="text-xl font-light mb-6 uppercase tracking-[2px]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Залишити відгук
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label 
              htmlFor="name" 
              className="block text-xs uppercase tracking-[1px] font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Ваше ім'я *
            </label>
            <input
              type="text"
              id="name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-0 py-3 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 uppercase tracking-[1px] text-sm"
              placeholder="ІМ'Я"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
          
          <div>
            <label 
              className="block text-xs uppercase tracking-[1px] font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Рейтинг *
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-gray-300 hover:text-yellow-400 focus:outline-none transition-colors"
                >
                  <Star
                    className={`w-6 h-6 md:w-8 md:h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label 
              htmlFor="comment" 
              className="block text-xs uppercase tracking-[1px] font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Коментар
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-0 py-3 bg-transparent border-b border-gray-300 focus:outline-none focus:border-b-2 focus:border-black placeholder-gray-500 text-sm resize-none"
              placeholder="Поділіться своїм досвідом..."
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-[2px] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {submitting ? 'Надсилаємо...' : 'Надіслати'}
          </button>
        </form>
      </div>
    </div>
  );
}