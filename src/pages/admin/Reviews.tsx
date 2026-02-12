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
  Clock,
  CheckCircle,
  EyeOff,
  Plus,
  Minus,
  Image as ImageIcon,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/helpers';
import { TableSkeleton } from '../../components/ui/SkeletonLoader';

interface QuestionWithProduct {
  id: number;
  product_id: number;
  user_name: string;
  question: string;
  answer?: string;
  created_at: string;
  is_approved: boolean;
  product: {
    name: string;
    slug: string;
  };
}

export default function Reviews() {
  const [activeSection, setActiveSection] = useState<'reviews' | 'questions'>('reviews');
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [questions, setQuestions] = useState<QuestionWithProduct[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ReviewWithProduct[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionWithProduct[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'approved' | 'all'>('all'); // Default to all
  const [searchTerm, setSearchTerm] = useState('');

  // Reply/Answer Modal
  const [replyModal, setReplyModal] = useState<{ open: boolean; item: ReviewWithProduct | QuestionWithProduct | null; type: 'review' | 'question' }>({
    open: false,
    item: null,
    type: 'review'
  });
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [activeSection, activeTab, reviews, questions, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch Reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          product:products(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Fetch Questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('product_questions')
        .select(`
          *,
          product:products(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Не вдалося завантажити дані');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (activeSection === 'reviews') {
      let filtered = [...reviews];

      if (activeTab === 'new') filtered = filtered.filter(r => !r.is_approved);
      else if (activeTab === 'approved') filtered = filtered.filter(r => r.is_approved);

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(r =>
          r.user_name?.toLowerCase().includes(term) ||
          r.comment?.toLowerCase().includes(term) ||
          (r.product as any)?.name?.toLowerCase().includes(term)
        );
      }
      setFilteredReviews(filtered);
    } else {
      let filtered = [...questions];

      // For questions, "new" means unanswered or unapproved (though we auto-approve now, maybe just check answer)
      if (activeTab === 'new') filtered = filtered.filter(q => !q.answer);
      else if (activeTab === 'approved') filtered = filtered.filter(q => !!q.answer);

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(q =>
          q.user_name?.toLowerCase().includes(term) ||
          q.question?.toLowerCase().includes(term) ||
          (q.product as any)?.name?.toLowerCase().includes(term)
        );
      }
      setFilteredQuestions(filtered);
    }
  };

  // Review Actions
  const handleApproveReview = async (reviewId: number, approve: boolean) => {
    try {
      const { error } = await supabase.from('reviews').update({ is_approved: approve }).eq('id', reviewId);
      if (error) throw error;

      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, is_approved: approve } : r));
      toast.success(approve ? 'Відгук схвалено' : 'Відгук приховано');
    } catch (e) {
      toast.error('Помилка оновлення статусу');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Видалити цей відгук?')) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Відгук видалено');
    } catch (e) {
      toast.error('Помилка видалення');
    }
  };

  // Question Actions
  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Видалити це питання?')) return;
    try {
      const { error } = await supabase.from('product_questions').delete().eq('id', questionId);
      if (error) throw error;
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      toast.success('Питання видалено');
    } catch (e) {
      toast.error('Помилка видалення');
    }
  };

  // Reply/Answer Handler
  const openReplyModal = (item: ReviewWithProduct | QuestionWithProduct, type: 'review' | 'question') => {
    setReplyModal({ open: true, item, type });
    if (type === 'review') {
      setReplyText((item as ReviewWithProduct).admin_reply || '');
    } else {
      setReplyText((item as QuestionWithProduct).answer || '');
    }
  };

  const saveReply = async () => {
    if (!replyModal.item) return;

    try {
      if (replyModal.type === 'review') {
        const { error } = await supabase
          .from('reviews')
          .update({ admin_reply: replyText || null })
          .eq('id', replyModal.item.id);
        if (error) throw error;

        setReviews(prev => prev.map(r => r.id === replyModal.item?.id ? { ...r, admin_reply: replyText || null } : r));
      } else {
        const { error } = await supabase
          .from('product_questions')
          .update({ answer: replyText || null }) // Questions are already auto-approved
          .eq('id', replyModal.item.id);
        if (error) throw error;

        setQuestions(prev => prev.map(q => q.id === replyModal.item?.id ? { ...q, answer: replyText || null } : q));
      }

      setReplyModal({ ...replyModal, open: false });
      setReplyText('');
      toast.success('Відповідь збережено');
    } catch (error) {
      console.error('Error saving reply:', error);
      toast.error('Не вдалося зберегти відповідь');
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700">{rating}/5</span>
    </div>
  );

  const formatDate = (dateString: string) => formatDateTime(dateString, true);

  if (loading) return <TableSkeleton rows={8} columns={5} />;

  const stats = {
    reviews: {
      total: reviews.length,
      new: reviews.filter(r => !r.is_approved).length,
      approved: reviews.filter(r => r.is_approved).length,
    },
    questions: {
      total: questions.length,
      new: questions.filter(q => !q.answer).length,
      answered: questions.filter(q => !!q.answer).length,
    }
  };

  const currentStats = activeSection === 'reviews' ? stats.reviews : { total: stats.questions.total, new: stats.questions.new, approved: stats.questions.answered };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Відгуки та Питання
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Управління відгуками та питаннями клієнтів
        </p>
      </div>

      {/* Section Toggle */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setActiveSection('reviews'); setActiveTab('all'); }}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeSection === 'reviews' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Відгуки ({stats.reviews.total})
        </button>
        <button
          onClick={() => { setActiveSection('questions'); setActiveTab('all'); }}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeSection === 'questions' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Питання ({stats.questions.total})
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всього</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{currentStats.total}</p>
            </div>
            {activeSection === 'reviews' ? <Star className="h-8 w-8 text-gray-400" /> : <HelpCircle className="h-8 w-8 text-gray-400" />}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{activeSection === 'reviews' ? 'Очікують модерації' : 'Без відповіді'}</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{currentStats.new}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{activeSection === 'reviews' ? 'Схвалені' : 'З відповіддю'}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{currentStats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Пошук..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Всі' },
              { key: 'new', label: activeSection === 'reviews' ? 'Нові' : 'Без відповіді' },
              { key: 'approved', label: activeSection === 'reviews' ? 'Схвалені' : 'З відповіддю' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 divide-y divide-gray-200">
        {activeSection === 'reviews' ? (
          filteredReviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Немає відгуків</div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{review.user_name}</h3>
                      {renderStars(review.rating)}
                      <span className={`text-xs px-2 py-0.5 rounded border ${review.is_approved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {review.is_approved ? 'Схвалено' : 'Очікує'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {formatDate(review.created_at)}
                      {review.product && (
                        <>
                          <span>•</span>
                          <Link to={`/product/${(review.product as any).slug}`} className="text-blue-600 hover:underline">
                            {(review.product as any).name}
                          </Link>
                        </>
                      )}
                    </div>

                    {review.comment && <p className="text-gray-800 mb-3">{review.comment}</p>}

                    {(review.pros || review.cons) && (
                      <div className="space-y-1 mb-3 text-sm">
                        {review.pros && <div className="text-green-700"><strong>+</strong> {review.pros}</div>}
                        {review.cons && <div className="text-red-700"><strong>-</strong> {review.cons}</div>}
                      </div>
                    )}

                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {review.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded border" onClick={() => window.open(img, '_blank')} />
                        ))}
                      </div>
                    )}

                    {review.admin_reply && (
                      <div className="bg-gray-100 p-3 rounded border border-gray-200 text-sm">
                        <div className="font-bold mb-1">Відповідь магазину:</div>
                        {review.admin_reply}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => handleApproveReview(review.id, !review.is_approved)}
                      className={`px-3 py-2 rounded text-sm font-medium border ${review.is_approved ? 'border-yellow-500 text-yellow-700 hover:bg-yellow-50' : 'bg-green-600 text-white hover:bg-green-700 border-transparent'}`}
                    >
                      {review.is_approved ? 'Приховати' : 'Схвалити'}
                    </button>
                    <button
                      onClick={() => openReplyModal(review, 'review')}
                      className="px-3 py-2 rounded text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Відповісти
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="px-3 py-2 rounded text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Немає питань</div>
          ) : (
            filteredQuestions.map((question) => (
              <div key={question.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{question.user_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded border ${question.answer ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {question.answer ? 'Є відповідь' : 'Без відповіді'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {formatDate(question.created_at)}
                      {question.product && (
                        <>
                          <span>•</span>
                          <Link to={`/product/${(question.product as any).slug}`} className="text-blue-600 hover:underline">
                            {(question.product as any).name}
                          </Link>
                        </>
                      )}
                    </div>

                    <p className="text-gray-900 font-medium mb-3">{question.question}</p>

                    {question.answer && (
                      <div className="bg-gray-100 p-3 rounded border border-gray-200 text-sm">
                        <div className="font-bold mb-1">Відповідь магазину:</div>
                        {question.answer}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => openReplyModal(question, 'question')}
                      className="px-3 py-2 rounded text-sm font-medium border border-black text-black hover:bg-gray-100 bg-white"
                    >
                      {question.answer ? 'Редагувати' : 'Відповісти'}
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="px-3 py-2 rounded text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Modal */}
      {replyModal.open && replyModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold">
                {replyModal.type === 'review' ? 'Відповідь на відгук' : 'Відповідь на питання'}
              </h3>
              <button onClick={() => setReplyModal({ ...replyModal, open: false })}><X className="w-6 h-6" /></button>
            </div>

            <div className="bg-gray-50 p-3 rounded mb-4 text-sm max-h-40 overflow-y-auto">
              <div className="font-bold mb-1">{replyModal.item.user_name}:</div>
              {replyModal.type === 'review'
                ? (replyModal.item as ReviewWithProduct).comment
                : (replyModal.item as QuestionWithProduct).question}
            </div>

            <textarea
              className="w-full p-3 border border-gray-300 rounded outline-none focus:border-black min-h-[150px]"
              placeholder="Введіть відповідь..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setReplyModal({ ...replyModal, open: false })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Скасувати
              </button>
              <button
                onClick={saveReply}
                className="px-4 py-2 bg-black text-white rounded hover:opacity-90 font-medium"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
