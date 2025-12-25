import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { ReviewWithProduct } from '../../types';
import { 
  Star, 
  Check, 
  Trash2, 
  MessageSquare, 
  X, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/helpers';
import { TableSkeleton } from '../../components/ui/SkeletonLoader';

export default function Reviews() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'approved' | 'all'>('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyModal, setReplyModal] = useState<{ open: boolean; review: ReviewWithProduct | null }>({
    open: false,
    review: null
  });
  const [replyText, setReplyText] = useState('');
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [activeTab, reviews, searchTerm]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          product:products(name, slug)
        `)
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

  const filterReviews = () => {
    let filtered = [...reviews];

    
    if (activeTab === 'new') {
      filtered = filtered.filter(review => !review.is_approved);
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(review => review.is_approved);
    }

    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(review => {
        const userName = review.user_name?.toLowerCase() || '';
        const comment = review.comment?.toLowerCase() || '';
        const productName = (review.product as any)?.name?.toLowerCase() || '';
        return userName.includes(term) || comment.includes(term) || productName.includes(term);
      });
    }

    setFilteredReviews(filtered);
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId ? { ...review, is_approved: true } : review
        )
      );
      
      toast.success('Відгук схвалено');
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Не вдалося схвалити відгук');
    }
  };

  const handleUnapprove = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: false })
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId ? { ...review, is_approved: false } : review
        )
      );
      
      toast.success('Відгук приховано');
    } catch (error) {
      console.error('Error unapproving review:', error);
      toast.error('Не вдалося приховати відгук');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей відгук? Цю дію неможливо скасувати.')) return;
    
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
      
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      
      toast.success('Відгук видалено');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Не вдалося видалити відгук');
    }
  };

  const handleReply = (review: ReviewWithProduct) => {
    setReplyText(review.admin_reply || '');
    setReplyModal({ open: true, review });
  };

  const saveReply = async () => {
    if (!replyModal.review) return;
    
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ admin_reply: replyText || null })
        .eq('id', replyModal.review.id);

      if (error) throw error;
      
      setReviews(prev => 
        prev.map(review => 
          review.id === replyModal.review!.id 
            ? { ...review, admin_reply: replyText || null } 
            : review
        )
      );
      
      setReplyModal({ open: false, review: null });
      setReplyText('');
      
      toast.success('Відповідь збережено');
    } catch (error) {
      console.error('Error saving reply:', error);
      toast.error('Не вдалося зберегти відповідь');
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString, true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">{rating}/5</span>
      </div>
    );
  };

  const getAverageRating = () => {
    if (filteredReviews.length === 0) return 0;
    const sum = filteredReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / filteredReviews.length).toFixed(1);
  };

  if (loading) {
    return <TableSkeleton rows={8} columns={5} />;
  }

  const stats = {
    total: reviews.length,
    new: reviews.filter(r => !r.is_approved).length,
    approved: reviews.filter(r => r.is_approved).length,
    averageRating: getAverageRating(),
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Відгуки
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Модерація та управління відгуками клієнтів
          </p>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Всього відгуків</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Star className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Очікують модерації</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.new}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Схвалені</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>Середній рейтинг</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.averageRating}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Пошук за ім'ям, коментарем або товаром..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
          </div>
          
          {}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex gap-2">
              {[
                { key: 'new', label: 'Нові', count: stats.new },
                { key: 'approved', label: 'Схвалені', count: stats.approved },
                { key: 'all', label: 'Всі', count: stats.total }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {activeTab === 'new' 
                ? 'Немає нових відгуків для модерації' 
                : activeTab === 'approved'
                ? 'Немає схвалених відгуків'
                : 'Немає відгуків'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReviews.map((review) => (
              <div key={review.id} className="hover:bg-gray-50 transition-colors">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              {review.user_name}
                            </h3>
                            {renderStars(review.rating)}
                            {!review.is_approved ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <Clock className="w-3 h-3 mr-1" />
                                Очікує модерації
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Схвалено
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex items-center text-sm text-gray-500 flex-wrap gap-2">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(review.created_at)}
                            </span>
                            {review.product && (
                              <>
                                <span>•</span>
                                <Link 
                                  to={'/product/' + encodeURIComponent((review.product as any).slug || '')} 
                                  className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                >
                                  <span>{(review.product as any).name}</span>
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {review.comment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {review.comment}
                          </p>
                        </div>
                      )}
                      
                      {review.admin_reply && (
                        <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-4 w-4 text-indigo-600" />
                            <p className="text-sm font-medium text-indigo-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              Відповідь Svitanok:
                            </p>
                          </div>
                          <p className="text-sm text-indigo-700 mt-1 whitespace-pre-wrap" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {review.admin_reply}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 lg:flex-col">
                      {!review.is_approved ? (
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Схвалити
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnapprove(review.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                          <EyeOff className="w-4 h-4 mr-1" />
                          Приховати
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleReply(review)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Відповісти
                      </button>
                      
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Видалити
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      {replyModal.open && replyModal.review && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Відповісти на відгук
              </h3>
              <button
                onClick={() => setReplyModal({ open: false, review: null })}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {replyModal.review.user_name}
                  </h4>
                  {renderStars(replyModal.review.rating)}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {replyModal.review.comment}
                </p>
                {replyModal.review.product && (
                  <p className="text-xs text-gray-500 mt-2">
                    Товар: {(replyModal.review.product as any).name}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Ваша відповідь
                </label>
                <textarea
                  id="reply"
                  rows={6}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
                  placeholder="Введіть вашу відповідь клієнту..."
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Відповідь буде відображатися під відгуком клієнта
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setReplyModal({ open: false, review: null })}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Скасувати
                </button>
                <button
                  onClick={saveReply}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Зберегти відповідь
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
