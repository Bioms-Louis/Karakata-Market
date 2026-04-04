import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, ToggleLeft,
         ToggleRight, Package, X, Upload,
         DollarSign, Layers, Image, Edit2 } from 'lucide-react';
import {
  getAdminProducts, createAdminProduct,
  updateAdminProduct, deleteAdminProduct,
  getAllVendors
} from '../../api/admin.api';
import { formatCurrency } from '../../utils/formatCurrency';
import ImageUploader from '../../components/common/ImageUploader';
import Spinner from '../../components/common/Spinner';
import { useNavigate } from 'react-router-dom';

const inputClass = (err) => `
  w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
  focus:ring-2 focus:ring-yellow-400 focus:border-transparent
  ${err ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}
`;

const Field = ({ label, required, error, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
  </div>
);

const AddProductModal = ({ onClose, vendors, categories }) => {
  const queryClient = useQueryClient();
  const [images, setImages] = useState([]);

  const {
    register, handleSubmit, control, watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      vendorId: '', name: '', description: '',
      shortDescription: '', categoryId: '',
      basePrice: '', discountPrice: '',
      stockQuantity: '', sku: '',
      isFeatured: false, variants: []
    }
  });

  const { fields: variantFields, append: addVariant,
          remove: removeVariant } = useFieldArray({
    control, name: 'variants'
  });

  const flattenCategories = (cats, depth = 0) => {
    const out = [];
    (cats || []).forEach(cat => {
      out.push({ id: cat.id, name: cat.name, depth });
      if (cat.children?.length > 0)
        out.push(...flattenCategories(cat.children, depth + 1));
    });
    return out;
  };
  const allCategories = flattenCategories(categories || []);

  const createMutation = useMutation({
    mutationFn: createAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Product created!');
      onClose();
    },
    onError: (err) => toast.error(
      err.response?.data?.message || 'Failed to create product.'
    )
  });

  const onSubmit = (data) => {
    if (images.some(img => img.uploading)) {
      toast.error('Wait for images to finish uploading.');
      return;
    }
    const validImages = images.filter(img => img.url && !img.uploading);
    if (validImages.length === 0) {
      toast.error('Add at least one product image.');
      return;
    }

    createMutation.mutate({
      vendorId: data.vendorId,
      name: data.name,
      description: data.description,
      shortDescription: data.shortDescription,
      categoryId: data.categoryId,
      basePrice: parseFloat(data.basePrice),
      discountPrice: data.discountPrice
        ? parseFloat(data.discountPrice) : null,
      stockQuantity: parseInt(data.stockQuantity),
      sku: data.sku || null,
      isFeatured: data.isFeatured,
      images: validImages.map(img => ({
        url: img.url, isPrimary: img.isPrimary
      })),
      variants: data.variants.map(v => ({
        name: v.name,
        price: v.price ? parseFloat(v.price) : null,
        stockQuantity: parseInt(v.stockQuantity) || 0,
        sku: v.sku || null,
        attributes: v.attributeKey && v.attributeValue
          ? { [v.attributeKey]: v.attributeValue } : {}
      })).filter(v => v.name)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start
                    justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl
                      my-8">
        <div className="flex items-center justify-between p-6 border-b
                        border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Add New Product
          </h2>
          <button onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          <div className="p-4 rounded-xl border-2 border-yellow-200
                          bg-yellow-50">
            <Field label="Assign to Vendor" required error={errors.vendorId}>
              <select
                className={inputClass(errors.vendorId)}
                {...register('vendorId', {
                  required: 'Please select a vendor'
                })}
              >
                <option value="">Select vendor...</option>
                {vendors?.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.store_name === 'Karakata Official'
                      ? '⭐ Karakata Official'
                      : v.store_name}
                    {v.owner_name ? ` (${v.owner_name})` : ''}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center
                           gap-2">
              <Package size={16} style={{ color: '#3c1a5b' }} />
              Basic Information
            </h3>

            <Field label="Product Name" required error={errors.name}>
              <input type="text"
                     placeholder="e.g. Samsung Galaxy S24 Ultra"
                     className={inputClass(errors.name)}
                     {...register('name', {
                       required: 'Product name is required',
                       minLength: { value: 5, message: 'Min 5 characters' }
                     })} />
            </Field>

            <Field label="Short Description" hint="Shown on product cards">
              <input type="text"
                     placeholder="Brief one-line description"
                     className={inputClass(false)}
                     {...register('shortDescription')} />
            </Field>

            <Field label="Full Description" required error={errors.description}>
              <textarea rows={4}
                        placeholder="Detailed product description..."
                        className={inputClass(errors.description)}
                        {...register('description', {
                          required: 'Description is required'
                        })} />
            </Field>

            <Field label="Category" required error={errors.categoryId}>
              <select className={inputClass(errors.categoryId)}
                      {...register('categoryId', {
                        required: 'Select a category'
                      })}>
                <option value="">Select category</option>
                {allCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.depth === 0 ? cat.name : cat.depth === 1 ? `  └ ${cat.name}` : `      └ ${cat.name}`}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center
                           gap-2">
              <DollarSign size={16} style={{ color: '#3c1a5b' }} />
              Pricing & Stock
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Base Price (₦)" required error={errors.basePrice}>
                <input type="number" step="0.01" min="0" placeholder="0.00"
                       className={inputClass(errors.basePrice)}
                       {...register('basePrice', {
                         required: 'Price is required',
                         min: { value: 1, message: 'Must be > 0' }
                       })} />
              </Field>

              <Field label="Discount Price (₦)" hint="Optional">
                <input type="number" step="0.01" min="0" placeholder="0.00"
                       className={inputClass(false)}
                       {...register('discountPrice', {
                         validate: (v) => {
                           const base = parseFloat(watch('basePrice'));
                           if (v && parseFloat(v) >= base)
                             return 'Must be less than base price';
                           return true;
                         }
                       })} />
              </Field>

              <Field label="Stock Quantity" required error={errors.stockQuantity}>
                <input type="number" min="0" placeholder="0"
                       className={inputClass(errors.stockQuantity)}
                       {...register('stockQuantity', {
                         required: 'Required',
                         min: { value: 0, message: 'Cannot be negative' }
                       })} />
              </Field>

              <Field label="SKU" hint="Optional">
                <input type="text" placeholder="e.g. SAM-S24"
                       className={inputClass(false)}
                       {...register('sku')} />
              </Field>
            </div>

            <label className="flex items-center gap-3 cursor-pointer
                              p-3 rounded-xl border border-gray-200">
              <input type="checkbox"
                     className="w-4 h-4 accent-purple-700"
                     {...register('isFeatured')} />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Mark as Featured
                </p>
                <p className="text-xs text-gray-500">Appears on homepage</p>
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700 flex items-center
                           gap-2">
              <Image size={16} style={{ color: '#3c1a5b' }} />
              Product Images
            </h3>
            <ImageUploader images={images} onChange={setImages} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700 flex items-center
                           gap-2">
              <Layers size={16} style={{ color: '#3c1a5b' }} />
              Variants (optional)
            </h3>

            {variantFields.map((field, index) => (
              <div key={field.id}
                   className="p-4 rounded-xl border border-gray-200
                              bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-600 uppercase">
                    Variant {index + 1}
                  </p>
                  <button type="button"
                          onClick={() => removeVariant(index)}
                          className="p-1 rounded text-gray-400
                                     hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: `variants.${index}.name`,
                      placeholder: 'Variant name *', required: true },
                    { name: `variants.${index}.price`,
                      placeholder: 'Price (optional)', type: 'number' },
                    { name: `variants.${index}.attributeKey`,
                      placeholder: 'Attribute (e.g. color)' },
                    { name: `variants.${index}.attributeValue`,
                      placeholder: 'Value (e.g. Red)' },
                    { name: `variants.${index}.stockQuantity`,
                      placeholder: 'Stock', type: 'number' },
                    { name: `variants.${index}.sku`,
                      placeholder: 'SKU (optional)' },
                  ].map((f) => (
                    <input key={f.name}
                           type={f.type || 'text'}
                           placeholder={f.placeholder}
                           className="w-full px-3 py-2.5 rounded-lg border
                                      border-gray-200 bg-white text-sm
                                      outline-none focus:ring-2
                                      focus:ring-yellow-400"
                           {...register(f.name, {
                             required: f.required || false
                           })} />
                  ))}
                </div>
              </div>
            ))}

            <button type="button"
                    onClick={() => addVariant({
                      name: '', price: '', stockQuantity: '',
                      sku: '', attributeKey: '', attributeValue: ''
                    })}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed
                               text-sm font-medium flex items-center
                               justify-center gap-2 hover:bg-gray-50"
                    style={{ borderColor: '#3c1a5b', color: '#3c1a5b' }}>
              <Plus size={14} />
              Add Variant
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-medium
                             border border-gray-200 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending ||
                      images.some(img => img.uploading)}
            className="flex-1 py-3 rounded-xl font-bold text-sm
                       flex items-center justify-center gap-2
                       transition-all hover:opacity-90
                       disabled:opacity-50"
            style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
          >
            {createMutation.isPending ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"
                     fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z" />
              </svg>Creating...</>
            ) : images.some(img => img.uploading) ? (
              'Uploading...'
            ) : (
              <><Upload size={16} />Create Product</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// MAIN ADMIN PRODUCTS PAGE
const AdminProductsPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: () => getAdminProducts({ search, page, limit: 15 }),
    select: (res) => res.data.data
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['all-vendors'],
    queryFn: getAllVendors,
    select: (res) => res.data.data.vendors
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => import('../../api/categories.api')
      .then(m => m.getCategories()),
    select: (res) => res.data.data.categories
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) =>
      updateAdminProduct(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted.');
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            All Products
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage every product on the platform
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     font-bold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm p-4">
        <div className="relative">
          <Search size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products by name..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border
                       border-gray-200 text-sm outline-none focus:ring-2
                       focus:ring-yellow-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm overflow-hidden">
        {isLoading ? <Spinner center /> : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50
                            border-b border-gray-100 text-xs font-semibold
                            text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Product</div>
              <div className="col-span-2">Vendor</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1 text-center">Stock</div>
              <div className="col-span-1 text-center">Active</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-gray-50">
              {products.map((product) => (
                <div key={product.id}
                     className="grid grid-cols-12 gap-4 px-5 py-4
                                items-center hover:bg-gray-50 transition-colors">

                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gray-100
                                    shrink-0 overflow-hidden">
                      {product.primary_image ? (
                        <img src={product.primary_image}
                             alt={product.name}
                             className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center
                                        justify-center"
                             style={{ backgroundColor: '#f5f0fa' }}>
                          <Package size={16}
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

                  <div className="col-span-2 min-w-0">
                    <p className="text-xs text-gray-600 truncate">
                      {product.vendor_name === 'Karakata Official'
                        ? '⭐ Karakata Official'
                        : product.vendor_name}
                    </p>
                  </div>

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

                  <div className="col-span-1 text-center">
                    <span className={`text-sm font-bold ${
                      product.stock_quantity === 0
                        ? 'text-red-500'
                        : product.stock_quantity < 10
                        ? 'text-orange-500'
                        : 'text-green-600'
                    }`}>
                      {product.stock_quantity}
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => toggleMutation.mutate({
                        id: product.id,
                        isActive: !product.is_active
                      })}
                    >
                      {product.is_active ? (
                        <ToggleRight size={26}
                                     style={{ color: '#3c1a5b' }} />
                      ) : (
                        <ToggleLeft size={26}
                                    className="text-gray-300" />
                      )}
                    </button>
                  </div>

                  {/* Edit button */}
                  <div className="col-span-2 flex items-center
                                  justify-end gap-1">
                    <button
                      onClick={() =>
                        navigate(`/admin/products/${product.id}/edit`)
                      }
                      className="p-2 rounded-lg text-gray-400
                                 hover:text-blue-500 hover:bg-blue-50
                                 transition-colors"
                      title="Edit product"
                    >
                      <Edit2 size={16} />
                    </button>
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

            {pagination?.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t
                              border-gray-100">
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
          </>
        )}
      </div>

      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          vendors={vendorsData}
          categories={categoriesData}
        />
      )}
    </div>
  );
};

export default AdminProductsPage;