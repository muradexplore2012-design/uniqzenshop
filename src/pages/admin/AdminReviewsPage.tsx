import React, { useEffect, useState } from 'react';
import { Star, CheckCircle, XCircle, Trash2, MessageSquare } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import { getAllReviewsAdmin, updateReviewStatus, deleteReview } from '../../services/reviewService';
import { Review } from '../../types/review';
import { formatDate } from '../../lib/utils';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';

export const AdminReviewsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const data = await getAllReviewsAdmin();
    setReviews(data);
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateReviewStatus(id, status);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      if (currentUser) {
        logAdminAction(currentUser.uid, `review.${status}`, 'review', id, {}, currentUser.email || '');
      }
    } catch (e) {
      alert('Failed to update review status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (currentUser) {
        logAdminAction(currentUser.uid, 'review.delete', 'review', id, {}, currentUser.email || '');
      }
    } catch (e) {
      alert('Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Reviews Moderation — Admin Portal | Uniqzen Shop" />

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Reviews & Ratings Moderation</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Moderate customer reviews before they appear publicly on product detail pages.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading reviews...</div>
      ) : reviews.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="divide-y divide-slate-100">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-5 flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{rev.userName}</span>
                    <span className="text-slate-400 text-xs">• on {rev.productName}</span>
                    <span className="text-slate-400 text-xs">• {formatDate(rev.createdAt)}</span>
                  </div>

                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed italic">"{rev.comment}"</p>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      rev.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rev.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rev.status}
                  </span>

                  {rev.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'approved')}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      title="Approve Review"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                  {rev.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'rejected')}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                      title="Reject Review"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No reviews submitted yet"
          description="Customer reviews submitted from gadget product pages will show up here for moderation."
        />
      )}
    </div>
  );
};
