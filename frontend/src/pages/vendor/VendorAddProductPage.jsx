import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Upload, Package,
  DollarSign, Layers, Image
} from 'lucide-react';
import { createProduct } from '../../api/products.api';
import { getCategories } from '../../api/categories.api';
import ImageUploader from '../../components/common/ImageUploader';

// ─────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
      <span style={{ color: '#3c1a5b' }}>{icon}</span>
      {title}
    </h2>
    {children}
  </div>
);

// ─────────────────────────────────────────────
// FIELD WRAPPER
// ─────────────────────────────────────────────
const Field = ({ label, error, required, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
  </div>
);

const inputClass = (hasError) => `
  w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
  focus:ring-2 focus:ring-yellow-400 focus:border-transparent
  ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}
`;

// MAIN ADD PRODUCT PAGE
const VendorAddProductPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Replaced old imageUrls state with images ──
  const [images, setImages] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      shortDescription: '',
      categoryId: '',
      basePrice: '',
      discountPrice: '',
      stockQuantity: '',
      sku: '',
      brand: '',
      isFeatured: false,
      variants: []
    }
  });

  const { fields: variantFields, append: addVariant,
          remove: removeVariant } = useFieldArray({
    control,
    name: 'variants'
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    select: (res) => res.data.data.categories
  });

 const buildAndFlatten = (flat) => {
  if (!flat?.length) return [];
  const hasChildren = flat.some(c => c.children?.length > 0);
  if (hasChildren) {
    const recurse = (cats, depth = 0) => {
      const out = [];
      cats.forEach(cat => {
        out.push({ id: cat.id, name: cat.name, depth });
        if (cat.children?.length > 0) out.push(...recurse(cat.children, depth + 1));
      });
      return out;
    };
    return recurse(flat.filter(c => !c.parent_id));
  }
  const map = {};
  flat.forEach(c => { map[c.id] = { ...c, _kids: [] }; });
  const roots = [];
  flat.forEach(c => {
    if (c.parent_id && map[c.parent_id]) map[c.parent_id]._kids.push(map[c.id]);
    else if (!c.parent_id) roots.push(map[c.id]);
  });
  const recurse = (cats, depth = 0) => {
    const out = [];
    cats.forEach(cat => {
      out.push({ id: cat.id, name: cat.name, depth });
      if (cat._kids?.length > 0) out.push(...recurse(cat._kids, depth + 1));
    });
    return out;
  };
  return recurse(roots);
};
const allCategories = buildAndFlatten(categoriesData);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      toast.success('Product created successfully!');
      navigate('/vendor/products');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create product.');
    }
  });

  const onSubmit = (data) => {
    // Block if images are still uploading
    if (images.some(img => img.uploading)) {
      toast.error('Please wait for all images to finish uploading.');
      return;
    }

    // Filter valid images only
    const validImages = images.filter(img => img.url && !img.uploading);

    if (validImages.length === 0) {
      toast.error('Please add at least one product image.');
      return;
    }

    const payload = {
      name: data.name,
      description: data.description,
      shortDescription: data.shortDescription,
      categoryId: data.categoryId,
      basePrice: parseFloat(data.basePrice),
      discountPrice: data.discountPrice
        ? parseFloat(data.discountPrice)
        : null,
      stockQuantity: parseInt(data.stockQuantity),
      sku: data.sku || null,
      brand: data.brand || null,
      isFeatured: data.isFeatured,
      images: validImages.map(img => ({
        url: img.url,
        isPrimary: img.isPrimary
      })),
      variants: data.variants.map(v => ({
        name: v.name,
        sku: v.sku || null,
        price: v.price ? parseFloat(v.price) : null,
        stockQuantity: parseInt(v.stockQuantity) || 0,
        attributes: v.attributeKey && v.attributeValue
          ? { [v.attributeKey]: v.attributeValue }
          : {}
      })).filter(v => v.name)
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the details below to list your product
          </p>
        </div>
        <button
          onClick={() => navigate('/vendor/products')}
          className="px-4 py-2 text-sm font-medium rounded-xl border
                     border-gray-200 hover:bg-gray-50 transition-colors"
        >
          ← Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column (2/3) ─────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <Section title="Basic Information" icon={<Package size={18} />}>
            <div className="space-y-4">
              <Field label="Product Name" required error={errors.name}>
                <input
                  type="text"
                  placeholder="e.g. Samsung Galaxy S24 Ultra 256GB"
                  className={inputClass(errors.name)}
                  {...register('name', {
                    required: 'Product name is required',
                    minLength: {
                      value: 5,
                      message: 'Name must be at least 5 characters'
                    }
                  })}
                />
              </Field>

              <Field
                label="Short Description"
                hint="Shown on product cards — keep it under 100 characters"
                error={errors.shortDescription}
              >
                <input
                  type="text"
                  placeholder="Brief one-line description"
                  className={inputClass(errors.shortDescription)}
                  {...register('shortDescription')}
                />
              </Field>

              <Field
                label="Full Description"
                required
                error={errors.description}
              >
                <textarea
                  rows={6}
                  placeholder="Describe your product in detail — features, specifications, what's in the box..."
                  className={inputClass(errors.description)}
                  {...register('description', {
                    required: 'Product description is required'
                  })}
                />
              </Field>

              <Field label="Category" required error={errors.categoryId}>
                <select
                  className={inputClass(errors.categoryId)}
                  {...register('categoryId', {
                    required: 'Please select a category'
                  })}
                >
                  <option value="">Select a category</option>
                  {allCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.depth === 0 ? cat.name
  : cat.depth === 1 ? `  └ ${cat.name}`
  : `      └ ${cat.name}`}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* Pricing & Stock */}
          <Section title="Pricing & Stock" icon={<DollarSign size={18} />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Base Price (₦)" required error={errors.basePrice}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={inputClass(errors.basePrice)}
                    {...register('basePrice', {
                      required: 'Price is required',
                      min: { value: 1, message: 'Price must be greater than 0' }
                    })}
                  />
                </Field>

                <Field
                  label="Discount Price (₦)"
                  hint="Optional — leave empty if no discount"
                  error={errors.discountPrice}
                >
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={inputClass(errors.discountPrice)}
                    {...register('discountPrice', {
                      validate: (value) => {
                        const base = parseFloat(watch('basePrice'));
                        if (value && parseFloat(value) >= base) {
                          return 'Discount price must be less than base price';
                        }
                        return true;
                      }
                    })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Stock Quantity"
                  required
                  error={errors.stockQuantity}
                >
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className={inputClass(errors.stockQuantity)}
                    {...register('stockQuantity', {
                      required: 'Stock quantity is required',
                      min: { value: 0, message: 'Cannot be negative' }
                    })}
                  />
                </Field>

                <Field label="SKU" hint="Your internal product code (optional)">
                  <input
                    type="text"
                    placeholder="e.g. SAM-S24U-256"
                    className={inputClass(false)}
                    {...register('sku')}
                  />
                </Field>

                <Field label="Brand" hint="e.g. Apple, Samsung, Nike (optional)">
                  <input
                    type="text"
                    placeholder="Enter brand name"
                    className={inputClass(false)}
                    {...register('brand')}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4
                                rounded-xl border border-gray-200
                                hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-purple-700"
                  {...register('isFeatured')}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Mark as Featured Product
                  </p>
                  <p className="text-xs text-gray-500">
                    Featured products appear on the homepage
                  </p>
                </div>
              </label>
            </div>
          </Section>

          {/* ── Product Images — now uses ImageUploader ── */}
          <Section title="Product Images" icon={<Image size={18} />}>
            <ImageUploader images={images} onChange={setImages} />
          </Section>

          {/* Variants */}
          <Section title="Product Variants" icon={<Layers size={18} />}>
            <p className="text-xs text-gray-500 mb-4">
              Add variants if your product comes in different sizes, colors,
              or other options. Leave empty if there's only one version.
            </p>

            {variantFields.length > 0 && (
              <div className="space-y-4 mb-4">
                {variantFields.map((field, index) => (
                  <div key={field.id}
                       className="p-4 rounded-xl border border-gray-200
                                  bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-700
                                    uppercase tracking-wider">
                        Variant {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="p-1.5 rounded-lg text-gray-400
                                   hover:text-red-500 hover:bg-red-50
                                   transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium
                                          text-gray-600 mb-1">
                          Variant Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Red / XL"
                          className="w-full px-3 py-2.5 rounded-lg border
                                     border-gray-200 bg-white text-sm
                                     outline-none focus:ring-2
                                     focus:ring-yellow-400"
                          {...register(`variants.${index}.name`, {
                            required: true
                          })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium
                                          text-gray-600 mb-1">
                          Price (₦) — optional
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Leave empty to use base price"
                          className="w-full px-3 py-2.5 rounded-lg border
                                     border-gray-200 bg-white text-sm
                                     outline-none focus:ring-2
                                     focus:ring-yellow-400"
                          {...register(`variants.${index}.price`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium
                                          text-gray-600 mb-1">
                          Attribute (e.g. "color", "size")
                        </label>
                        <input
                          type="text"
                          placeholder="color"
                          className="w-full px-3 py-2.5 rounded-lg border
                                     border-gray-200 bg-white text-sm
                                     outline-none focus:ring-2
                                     focus:ring-yellow-400"
                          {...register(`variants.${index}.attributeKey`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium
                                          text-gray-600 mb-1">
                          Value (e.g. "Red", "XL")
                        </label>
                        <input
                          type="text"
                          placeholder="Red"
                          className="w-full px-3 py-2.5 rounded-lg border
                                     border-gray-200 bg-white text-sm
                                     outline-none focus:ring-2
                                     focus:ring-yellow-400"
                          {...register(`variants.${index}.attributeValue`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium
                                          text-gray-600 mb-1">
                          Stock Quantity *
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full px-3 py-2.5 rounded-lg border
                                     border-gray-200 bg-white text-sm
                                     outline-none focus:ring-2
                                     focus:ring-yellow-400"
                          {...register(`variants.${index}.stockQuantity`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium
                                          text-gray-600 mb-1">
                          SKU (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Variant SKU"
                          className="w-full px-3 py-2.5 rounded-lg border
                                     border-gray-200 bg-white text-sm
                                     outline-none focus:ring-2
                                     focus:ring-yellow-400"
                          {...register(`variants.${index}.sku`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => addVariant({
                name: '', price: '', stockQuantity: '',
                sku: '', attributeKey: '', attributeValue: ''
              })}
              className="w-full py-3 rounded-xl border-2 border-dashed
                         text-sm font-medium flex items-center
                         justify-center gap-2 transition-colors
                         hover:bg-gray-50"
              style={{ borderColor: '#3c1a5b', color: '#3c1a5b' }}
            >
              <Plus size={16} />
              Add Variant
            </button>
          </Section>
        </div>

        {/* ── Right Column (1/3) ─────────── */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-5 sticky top-24">
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Ready to Publish?
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Your product will be visible to customers immediately
              after submission.
            </p>

            <button
              onClick={handleSubmit(onSubmit)}
              disabled={
                createMutation.isPending ||
                images.some(img => img.uploading)
              }
              className="w-full py-4 rounded-xl font-bold text-sm
                         flex items-center justify-center gap-2
                         transition-all hover:opacity-90
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
            >
              {createMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4"
                       viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12"
                            r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Publishing...
                </>
              ) : images.some(img => img.uploading) ? (
                <>
                  <svg className="animate-spin h-4 w-4"
                       viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12"
                            r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Uploading Images...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Publish Product
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/vendor/products')}
              className="w-full mt-3 py-3 rounded-xl text-sm font-medium
                         border border-gray-200 hover:bg-gray-50
                         transition-colors"
            >
              Cancel
            </button>

            {/* Checklist */}
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
              <p className="text-xs font-bold text-gray-600 mb-3">
                Before publishing:
              </p>
              {[
                'Product name is clear and descriptive',
                'Price is set correctly in Naira',
                'Stock quantity is accurate',
                'At least one image uploaded or linked',
                'Category is correctly selected',
              ].map((tip) => (
                <div key={tip}
                     className="flex items-start gap-2 text-xs text-gray-500">
                  <div className="w-4 h-4 rounded-full border-2 flex-shrink-0
                                  mt-0.5"
                       style={{ borderColor: '#3c1a5b' }} />
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAddProductPage;