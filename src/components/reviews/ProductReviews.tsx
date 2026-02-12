import { useState, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useProductReviews } from '@/hooks/useProductReviews';
import {
  Star,
  MessageSquare,
  Plus,
  Minus,
  Image as ImageIcon,
  X,
  ShoppingCart,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate as formatDateHelper } from '../../utils/helpers';
import ImageLightbox from '../product/ImageLightbox';

interface ProductReviewsProps {
  productId: string | number;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { reviews, questions, isLoading, addReview, addQuestion, voteReview, replyToReview } = useProductReviews(productId);
  const [activeTab, setActiveTab] = useState<'reviews' | 'questions'>('reviews');

  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Lightbox state
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    index: number;
    images: string[];
  }>({
    isOpen: false,
    index: 0,
    images: []
  });

  // Review Form state
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Question Form state
  const [questionUserName, setQuestionUserName] = useState('');
  const [questionText, setQuestionText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = total > 0 ? (sum / total).toFixed(2) : '0.00';

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    reviews.forEach(r => {
      const rounded = Math.round(r.rating);
      if (counts[rounded] !== undefined) counts[rounded]++;
    });

    return { total, average, counts };
  }, [reviews]);

  // Aggregate all images
  const allReviewImages = useMemo(() => {
    return reviews.reduce((acc, r) => [...acc, ...(r.images || [])], [] as string[]);
  }, [reviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
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

      await addReview.mutateAsync({
        productId,
        userName,
        rating,
        comment,
        pros,
        cons,
        images: selectedImages,
        userId: session?.user?.id
      });

      // Reset form
      setUserName('');
      setRating(0);
      setComment('');
      setPros('');
      setCons('');
      setSelectedImages([]);
      setImagePreviews([]);
      setShowForm(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      toast.success('Дякуємо! Відгук з\'явиться після модерації');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Не вдалося надіслати відгук');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionUserName.trim() || !questionText.trim()) {
      toast.error('Введіть ім\'я та запитання');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      await addQuestion.mutateAsync({
        productId,
        userName: questionUserName,
        question: questionText,
        userId: session?.user?.id
      });

      setQuestionUserName('');
      setQuestionText('');
      setShowForm(false);
      toast.success('Запитання опубліковано!');
    } catch (e) {
      toast.error('Помилка при надсиланні запитання');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (reviewId: number) => {
    if (!replyContent.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Allow anonymous reply if needed or user name? 
      // For now logic assumes we have a user or guest.
      const name = session?.user?.user_metadata?.full_name || 'Гість';

      await replyToReview.mutateAsync({
        reviewId,
        content: replyContent,
        userName: name,
        userId: session?.user?.id || 'guest', // Using guest ID if not logged in
      });

      setReplyContent('');
      setActiveReplyId(null);
      toast.success('Відповідь надіслано на модерацію');
    } catch (e) {
      toast.error('Помилка при надсиланні відповіді');
    }
  };

  const handleVote = async (reviewId: number, type: 'like' | 'dislike') => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Увійдіть, щоб оцінювати відгуки');
      return;
    }

    voteReview.mutate({ reviewId, voteType: type, userId: session.user.id });
  };


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + selectedImages.length > 3) {
      toast.error('Максимально можна завантажити 3 фото');
      return;
    }

    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 2 * 1024 * 1024; // 2MB
      if (!isValidSize) toast.error(`Файл ${file.name} завеликий (макс. 2MB)`);
      return isValidSize;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const formatDate = (dateString: string) => {
    return formatDateHelper(dateString);
  };

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
              }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 pb-12">
        {/* Header & Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`text-xl md:text-2xl font-bold pb-4 transition-colors ${activeTab === 'reviews' ? 'border-b-2 border-black text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Відгуки <span className={`text-lg font-normal ml-1 border px-1.5 rounded-full text-sm align-middle ${activeTab === 'reviews' ? 'text-gray-500 border-gray-300' : 'text-gray-400 border-gray-200'}`}>{reviews.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`text-xl md:text-2xl font-bold pb-4 transition-colors ${activeTab === 'questions' ? 'border-b-2 border-black text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Питання <span className={`text-lg font-normal ml-1 border px-1.5 rounded-full text-sm align-middle ${activeTab === 'questions' ? 'text-gray-500 border-gray-300' : 'text-gray-400 border-gray-200'}`}>{questions.length}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          {/* Left Column: Stats & Actions */}
          <div className="w-full lg:w-1/3 space-y-8">
            <div className="bg-white">
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{stats.average}</span>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">з 5</span>
                    {renderStars(Number(stats.average), "w-5 h-5")}
                  </div>
                </div>
                <p className="text-sm text-gray-500">на основі {stats.total} відгуків</p>
              </div>

              {/* Rating Bars */}
              <div className="space-y-3 mb-8">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = stats.counts[stars] || 0;
                  const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 w-8">
                        <span className="font-medium">{stars}</span>
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FFBC00] rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-400 text-xs">{count}</span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full py-3 border-2 border-black text-black font-bold rounded-lg hover:bg-gray-50 transition duration-200 text-sm uppercase tracking-wider"
              >
                {showForm ? 'Згорнути форму' : (activeTab === 'reviews' ? 'Написати відгук' : 'Задати питання')}
              </button>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="w-full lg:w-2/3">

            {/* --- REVIEWS TAB --- */}
            {activeTab === 'reviews' && (
              <>
                {/* Reviews Form Area */}
                {showForm && (
                  <div className="mb-10 bg-gray-50 p-6 rounded-lg border border-gray-100 animate-fade-in">
                    <h3 className="text-lg font-bold mb-4">Написати відгук</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Ваше ім'я *</label>
                          <input
                            type="text"
                            id="name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Рейтинг *</label>
                          <div className="flex gap-1 py-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'fill-[#FFBC00] text-[#FFBC00]' : 'text-gray-300'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="pros" className="block text-sm font-medium text-gray-700 mb-1">Переваги</label>
                          <input
                            type="text"
                            id="pros"
                            value={pros}
                            onChange={(e) => setPros(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                            placeholder="Що сподобалось?"
                          />
                        </div>
                        <div>
                          <label htmlFor="cons" className="block text-sm font-medium text-gray-700 mb-1">Недоліки</label>
                          <input
                            type="text"
                            id="cons"
                            value={cons}
                            onChange={(e) => setCons(e.target.value)}
                            className="w-full p-3 bg-white border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                            placeholder="Що не так?"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Коментар</label>
                        <textarea
                          id="comment"
                          rows={4}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full p-3 bg-white border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black outline-none transition resize-none"
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={selectedImages.length >= 3}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50"
                          >
                            <ImageIcon className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-600">Додати фото</span>
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                          />
                          <span className="text-xs text-gray-400">Макс. 3 фото</span>
                        </div>

                        {/* Previews */}
                        {imagePreviews.length > 0 && (
                          <div className="flex gap-3 mt-4">
                            {imagePreviews.map((src, index) => (
                              <div key={index} className="relative w-20 h-20 border border-gray-200 rounded overflow-hidden group">
                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3 text-red-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-8 py-3 bg-black text-white font-bold rounded hover:opacity-90 transition disabled:opacity-70"
                        >
                          {submitting ? 'Надсилаємо...' : 'Залишити відгук'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Photos Strip */}
                {allReviewImages.length > 0 && (
                  <div className="mb-10 bg-white border border-gray-100 rounded-lg p-5">
                    <h3 className="font-bold text-lg mb-4 text-gray-900">Фотографії та відео покупців</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {allReviewImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="w-24 h-24 flex-shrink-0 cursor-pointer hover:opacity-90 transition rounded overflow-hidden"
                          onClick={() => setLightbox({
                            isOpen: true,
                            index: idx,
                            images: allReviewImages
                          })}
                        >
                          <img src={img} alt="User upload" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-0">
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500 mb-2">Ще немає відгуків про цей товар</p>
                      <p className="text-sm text-gray-400">Станьте першим, хто поділиться враженнями!</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 py-6 last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-gray-900">{review.user_name}</h3>
                            <div className="flex items-center gap-1 text-green-600">
                              <ShoppingCart className="w-4 h-4" />
                              <span className="text-xs font-medium">Я купив цей товар</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-400">{formatDate(review.created_at)}</span>
                        </div>

                        <div className="mb-3">
                          {renderStars(review.rating)}
                        </div>

                        {review.comment && (
                          <div className="text-gray-800 text-sm leading-relaxed mb-4">
                            {review.comment}
                          </div>
                        )}

                        {(review.pros || review.cons) && (
                          <div className="space-y-2 mb-4">
                            {review.pros && (
                              <div className="text-sm">
                                <span className="font-bold text-green-600">Переваги: </span>
                                {review.pros}
                              </div>
                            )}
                            {review.cons && (
                              <div className="text-sm">
                                <span className="font-bold text-red-600">Недоліки: </span>
                                {review.cons}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Review Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mb-4">
                            {review.images.map((img, idx) => (
                              <div key={idx} className="w-20 h-20 rounded overflow-hidden cursor-pointer"
                                onClick={() => setLightbox({
                                  isOpen: true,
                                  index: allReviewImages.indexOf(img),
                                  images: allReviewImages
                                })}
                              >
                                <img src={img} alt="Review" className="w-full h-full object-cover hover:scale-105 transition" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                          <button
                            onClick={() => setActiveReplyId(activeReplyId === review.id ? null : review.id)}
                            className="flex items-center gap-2 text-blue-600 hover:text-black text-sm font-medium transition-colors"
                          >
                            <CornerDownRight className="w-4 h-4" />
                            Відповісти
                          </button>

                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleVote(review.id, 'like')}
                              className={`flex items-center gap-1.5 transition-colors ${review.user_vote === 'like' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                            >
                              <ThumbsUp className={`w-4 h-4 ${review.user_vote === 'like' ? 'fill-current' : ''}`} />
                              <span className="text-sm">{review.likes_count}</span>
                            </button>
                            <button
                              onClick={() => handleVote(review.id, 'dislike')}
                              className={`flex items-center gap-1.5 transition-colors ${review.user_vote === 'dislike' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                            >
                              <ThumbsDown className={`w-4 h-4 ${review.user_vote === 'dislike' ? 'fill-current' : ''}`} />
                              <span className="text-sm">{review.dislikes_count}</span>
                            </button>
                          </div>
                        </div>

                        {/* Reply Form */}
                        {activeReplyId === review.id && (
                          <div className="mt-4 pl-4 border-l-2 border-gray-200 animate-fade-in">
                            <textarea
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded focus:border-black outline-none text-sm"
                              rows={2}
                              placeholder="Ваша відповідь..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleReplySubmit(review.id)}
                                className="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:opacity-90 uppercase tracking-wider"
                              >
                                Надіслати
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Replies List */}
                        {review.replies && review.replies.length > 0 && (
                          <div className="mt-4 space-y-4 pl-6 border-l border-gray-100">
                            {review.replies.map(reply => (
                              <div key={reply.id} className="bg-gray-50 p-4 rounded-lg text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-gray-900">{reply.user_name}</span>
                                  <span className="text-gray-400 text-xs">{formatDate(reply.created_at)}</span>
                                </div>
                                <p className="text-gray-700">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Admin Reply */}
                        {review.admin_reply && (
                          <div className="mt-4 ml-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm">Svitanok</span>
                              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">Продавець</span>
                            </div>
                            <p className="text-sm text-gray-700">{review.admin_reply}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* --- QUESTIONS TAB --- */}
            {activeTab === 'questions' && (
              <>
                {showForm && (
                  <div className="mb-10 bg-gray-50 p-6 rounded-lg border border-gray-100 animate-fade-in">
                    <h3 className="text-lg font-bold mb-4">Задати питання</h3>
                    <form onSubmit={handleSubmitQuestion} className="space-y-4">
                      <div>
                        <label htmlFor="q-name" className="block text-sm font-medium text-gray-700 mb-1">Ваше ім'я *</label>
                        <input
                          type="text"
                          id="q-name"
                          value={questionUserName}
                          onChange={(e) => setQuestionUserName(e.target.value)}
                          className="w-full p-3 bg-white border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                        />
                      </div>
                      <div>
                        <label htmlFor="q-text" className="block text-sm font-medium text-gray-700 mb-1">Питання *</label>
                        <textarea
                          id="q-text"
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          rows={4}
                          className="w-full p-3 bg-white border border-gray-300 rounded focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3 bg-black text-white font-bold rounded hover:opacity-90 transition disabled:opacity-70 mt-2"
                      >
                        {submitting ? 'Надсилаємо...' : 'Задати питання'}
                      </button>
                    </form>
                  </div>
                )}

                <div className="space-y-0">
                  {questions.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-2">Ще немає питань про цей товар</p>
                      <p className="text-sm text-gray-400">Є запитання? Запитайте нас!</p>
                    </div>
                  ) : (
                    questions.map((q) => (
                      <div key={q.id} className="border-b border-gray-100 py-6 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-gray-900">{q.user_name}</h3>
                          <span className="text-sm text-gray-400">{formatDate(q.created_at)}</span>
                        </div>
                        <p className="text-gray-800 text-sm mb-4">{q.question}</p>

                        {q.answer && (
                          <div className="ml-6 p-4 bg-gray-50 rounded-lg border-l-4 border-black">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm text-black">Svitanok</span>
                              <span className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-600">Відповідь</span>
                            </div>
                            <p className="text-sm text-gray-700">{q.answer}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

          </div>
        </div>

      </div>

      {/* Lightbox */}
      {lightbox.isOpen && (
        <ImageLightbox
          isOpen={lightbox.isOpen}
          onClose={() => setLightbox({ isOpen: false, index: 0, images: [] })}
          images={lightbox.images}
          currentIndex={lightbox.index}
          onIndexChange={(index) => setLightbox(prev => ({ ...prev, index }))}
          productName="Фото відгуку"
        />
      )}
    </>
  );
}