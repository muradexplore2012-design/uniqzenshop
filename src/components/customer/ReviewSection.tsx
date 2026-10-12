import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle, Send } from 'lucide-react';
import { Review } from '../../types/review';
import { getProductReviews, submitReview } from '../../services/reviewService';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../lib/authContext';

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ productId, productName }) => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState(currentUser?.displayName || '');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    setLoading(true);
    const data = await getProductReviews(productId);
    setReviews(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await submitReview({
        productId,
        productName,
        userId: currentUser?.uid || 'guest',
        userName: reviewerName.trim() || 'Valued Customer',
        rating,
        comment: comment.trim(),
        verifiedPurchase: Boolean(currentUser),
      });

      setComment('');
      setSubmittedMessage(true);
      setTimeout(() => setSubmittedMessage(false), 6000);
    } catch (e) {
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="space-y-8">
      {/* Average rating overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 rounded-2xl border border-brand-border gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Customer Ratings & Reviews</h3>
          <p className="text-xs text-slate-500">Based on authentic customer feedback</p>
        </div>

        {averageRating ? (
          <div className="flex items-center space-x-3">
            <span className="text-3xl font-extrabold text-slate-900">{averageRating}</span>
            <div>
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(Number(averageRating)) ? 'fill-current' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{reviews.length} reviews verified</p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">No ratings yet for this gadget.</div>
        )}
      </div>

      {/* Review Submission Form */}
      <div className="bg-white p-6 rounded-2xl border border-brand-border">
        <h4 className="text-base font-semibold text-slate-900 mb-2">Write a Review</h4>
        <p className="text-xs text-slate-500 mb-4">
          Share your experience with this gadget to help other shoppers.
        </p>

        {submittedMessage ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Thank you! Your review has been submitted for moderation.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= rating ? 'text-amber-400 fill-current' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rafian Ahmed"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Review Comment</label>
              <textarea
                rows={3}
                required
                placeholder="What did you like or dislike? Battery life, sound quality, build quality?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full text-sm p-3.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 bg-white rounded-xl border border-brand-border space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-slate-900">{rev.userName}</span>
                  {rev.verifiedPurchase && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{formatDate(rev.createdAt)}</span>
              </div>

              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-slate-200'}`}
                  />
                ))}
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">{rev.comment}</p>
            </div>
          ))
        ) : (
          <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No customer reviews yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Be the first to review this gadget.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
