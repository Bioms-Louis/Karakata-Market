import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit2, Trash2, Eye,
  Package, ToggleLeft, ToggleRight
} from 'lucide-react';
import { getProducts, deleteProduct, updateProduct } from '../../api/products.api';
import { formatCurrency } from '../../utils/formatCurrency';
import Spinner from '../../components/common/Spinner';
import useAuthStore from '../../store/authStore';

const VendorProductsPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-products', search, page],
    queryFn: () => getProducts({
      vendorId: user?.vendorId,
      search,
      page,
      limit: 10
    }),
    select: (res) => res.data.data
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Product deleted.');
    },
    onError: () => toast.error('Failed to delete product.')
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateProduct(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Product updated.');
    }
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const products = data?.products || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your product listings
          </p>
        </div>
        <Link
          to="/vendor/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     font-bold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search your products..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border
                       border-gray-200 text-sm outline-none focus:ring-2
                       focus:ring-yellow-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                      overflow-hidden">
        {isLoading ? (
          <Spinner center />
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium mb-1">No products yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Start by adding your first product
            </p>
            <Link
              to="/vendor/products/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                         font-bold text-sm"
              style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
            >
              <Plus size={16} />
              Add Your First Product
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50
                            border-b border-gray-100 text-xs font-semibold
                            text-gray-500 uppercase tracking-wider">
              <div className="col-span-5">Product</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-center">Stock</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-50">
              {products.map((product) => (
                <div key={product.id}
                     className="grid grid-cols-12 gap-4 px-5 py-4
                                items-center hover:bg-gray-50 transition-colors">

                  {/* Product Info */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gray-100
                                    flex-shrink-0 overflow-hidden">
                      {product.primary_image ? (
                        <img src={product.primary_image}
                             alt={product.name}
                             className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center
                                        justify-center"
                             style={{ backgroundColor: '#f5f0fa' }}>
                          <Package size={18}
                                   style={{ color: '#3c1a5b' }}
                                   className="opacity-40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900
                                    truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {product.category_name}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-bold"
                       style={{ color: '#3c1a5b' }}>
                      {formatCurrency(
                        product.discount_price || product.base_price
                      )}
                    </p>
                    {product.discount_price && (
                      <p className="text-xs text-gray-400 line-through">
                        {formatCurrency(product.base_price)}
                      </p>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="col-span-2 text-center">
                    <span className={`text-sm font-bold ${
                      product.stock_quantity === 0
                        ? 'text-red-500'
                        : product.stock_quantity < 10
                        ? 'text-orange-500'
                        : 'text-green-600'
                    }`}>
                      {product.stock_quantity}
                    </span>
                    <p className="text-xs text-gray-400">units</p>
                  </div>

                  {/* Active Toggle */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => toggleMutation.mutate({
                        id: product.id,
                        isActive: !product.is_active
                      })}
                      className="transition-colors"
                      title={product.is_active
                        ? 'Click to deactivate'
                        : 'Click to activate'}
                    >
                      {product.is_active ? (
                        <ToggleRight size={28}
                                     style={{ color: '#3c1a5b' }} />
                      ) : (
                        <ToggleLeft size={28} className="text-gray-300" />
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center
                                  justify-end gap-1">
                    <Link
                      to={`/products/${product.slug}`}
                      className="p-2 rounded-lg text-gray-400
                                 hover:text-purple-600 hover:bg-purple-50
                                 transition-colors"
                      title="View product"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      to={`/vendor/products/${product.id}/edit`}
                      className="p-2 rounded-lg text-gray-400
                                 hover:text-blue-600 hover:bg-blue-50
                                 transition-colors"
                      title="Edit product"
                    >
                      <Edit2 size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-2 rounded-lg text-gray-400
                                 hover:text-red-500 hover:bg-red-50
                                 transition-colors"
                      title="Delete product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination?.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t
                              border-gray-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium rounded-xl
                             border transition-colors disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-xl
                             border transition-colors disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VendorProductsPage;