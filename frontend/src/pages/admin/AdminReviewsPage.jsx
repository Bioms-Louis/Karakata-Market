import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Star, Trash2, Flag, Search,
  MessageSquare, AlertTriangle
} from 'lucide-react';
import {
  getAdminReviews, deleteAdminReview, flagReview
} from '../../api/admin.api';
import { formatDate } from '../../utils/formatDate';
import Spinner from '../../components/common/Spinner';

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star
        key={s}
        size={13}
        fill={s <= rating ? '#fbbf24' : 'none'}
        stroke={s <= rating ? '#fbbf24' : '#d1d5db'}
      />
    ))}
  </div>
);

const AdminReviewsPage = () => {
  const [search, setSearch] = useState('');
  const [showFlagged, setShowFlagged] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', search, showFlagged, page],
    queryFn: () => getAdminReviews({
      search, flagged: showFlagged, page, limit: 15
    }),
    select: (res) => res.data.data
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review deleted.');
    },
    onError: () => toast.error('Failed to delete review.')
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, flagged }) => flagReview(id, { flagged }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review updated.');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Delete this review permanently?')) {
      deleteMutation.mutate(id);
    }
  };

  const reviews = data?.reviews || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Product Reviews
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Monitor and moderate customer reviews
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by reviewer, product, or content..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border
                       border-gray-200 text-sm outline-none
                       focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <button
          onClick={() => { setShowFlagged(!showFlagged); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl
                      text-sm font-semibold transition-all ${
            showFlagged
              ? 'text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          style={showFlagged ? { backgroundColor: '#991b1b' } : {}}
        >
          <AlertTriangle size={15} />
          Flagged Only
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading ? <Spinner center /> : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm py-16 text-center">
            <MessageSquare size={40}
                           className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No reviews found</p>
          </div>
        ) : reviews.map((review) => (
          <div
            key={review.id}
            className={`bg-white rounded-2xl border shadow-sm p-5
                        transition-all ${
              review.is_flagged
                ? 'border-red-200 bg-red-50/30'
                : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-4">

              {/* Left — Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <StarRating rating={review.rating} />
                  {review.title && (
                    <p className="text-sm font-bold text-gray-900">
                      {review.title}
                    </p>
                  )}
                  {review.is_flagged && (
                    <span className="flex items-center gap-1 px-2 py-0.5
                                     rounded-full text-xs font-bold
                                     bg-red-100 text-red-600">
                      <Flag size={10} />
                      Flagged
                    </span>
                  )}
                </div>

                {review.comment && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {review.comment}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>
                    👤 <strong>{review.reviewer_name}</strong>
                    {' '}·{' '}{review.reviewer_email}
                  </span>
                  <span>
                    📦 <strong>{review.product_name}</strong>
                  </span>
                  <span>
                    🏪 {review.vendor_name}
                  </span>
                  <span>
                    🕐 {formatDate(review.created_at)}
                  </span>
                </div>
              </div>

              {/* Right — Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => flagMutation.mutate({
                    id: review.id,
                    flagged: !review.is_flagged
                  })}
                  disabled={flagMutation.isPending}
                  className={`flex items-center gap-1.5 px-3 py-1.5
                               rounded-lg text-xs font-semibold
                               transition-colors ${
                    review.is_flagged
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                  }`}
                >
                  <Flag size={12} />
                  {review.is_flagged ? 'Unflag' : 'Flag'}
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5
                             rounded-lg text-xs font-semibold
                             bg-red-50 text-red-600 hover:bg-red-100
                             transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-xl border
                             disabled:opacity-40">
            ← Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {pagination.totalPages}
          </span>
          <button onClick={() => setPage(p => p + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 text-sm rounded-xl border
                             disabled:opacity-40">
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;