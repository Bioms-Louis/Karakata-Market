import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Trash2, Upload, Package,
  DollarSign, Layers, Image, Plus, X
} from 'lucide-react';
import { getProductById, updateProduct } from '../../api/products.api';
import { getCategories } from '../../api/categories.api';
import ImageUploader from '../../components/common/ImageUploader';
import Spinner from '../../components/common/Spinner';

// HELPERS
const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <h2 className="text-base font-bold text-gray-900 mb-5
                   flex items-center gap-2">
      <span style={{ color: '#3c1a5b' }}>{icon}</span>
      {title}
    </h2>
    {children}
  </div>
);

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

// VARIANT BUILDER
const TAG_COLORS = [
  '#3c1a5b','#dc2626','#2563eb','#16a34a',
  '#d97706','#7c3aed','#db2777','#0891b2'
];

const VariantBuilder = ({ initialVariants = [], onChange }) => {
  const [colors, setColors]         = useState([]);
  const [sizes, setSizes]           = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput]   = useState('');
  const [basePrice, setBasePrice]   = useState('');
  const [combos, setCombos]         = useState([]);
  const [seeded, setSeeded]         = useState(false);

  // ── Seed from existing variants once ──────
  useEffect(() => {
    if (seeded || initialVariants.length === 0) return;

    const existingColors = [...new Set(
      initialVariants.map(v => v.attributes?.Color).filter(Boolean)
    )];
    const existingSizes = [...new Set(
      initialVariants.map(v => v.attributes?.Size).filter(Boolean)
    )];

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColors(existingColors);
    setSizes(existingSizes);
    setCombos(initialVariants.map(v => ({
      id:    v.id   || null,
      color: v.attributes?.Color || v.name || '',
      size:  v.attributes?.Size  || '',
      stock: v.stock_quantity ?? v.stockQuantity ?? 0,
      price: v.price || '',
      sku:   v.sku   || '',
    })));
    setSeeded(true);
  }, [initialVariants, seeded]);

  // ── Push changes up to parent ─────────────
  useEffect(() => {
    onChange(combos.map(c => ({
      id:            c.id,
      name:          c.size ? `${c.color} / ${c.size}` : c.color,
      stockQuantity: parseInt(c.stock) || 0,
      price:         c.price ? parseFloat(c.price) : null,
      sku:           c.sku || null,
      attributes:    c.size
        ? { Color: c.color, Size: c.size }
        : { Color: c.color }
    })));
  }, [combos]);

  const addColor = () => {
    const val = colorInput.trim();
    if (!val || colors.includes(val)) return;
    setColors(prev => [...prev, val]);
    setColorInput('');
  };

  const addSize = () => {
    const val = sizeInput.trim();
    if (!val || sizes.includes(val)) return;
    setSizes(prev => [...prev, val]);
    setSizeInput('');
  };

  const removeColor = (color) => {
    setColors(prev => prev.filter(c => c !== color));
    setCombos(prev => prev.filter(c => c.color !== color));
  };

  const removeSize = (size) => {
    setSizes(prev => prev.filter(s => s !== size));
    setCombos(prev => prev.filter(c => c.size !== size));
  };

  const generateCombos = () => {
    if (colors.length === 0) {
      toast.error('Add at least one color first.');
      return;
    }
    const next = [];
    if (sizes.length > 0) {
      colors.forEach(color => {
        sizes.forEach(size => {
          const existing = combos.find(
            c => c.color === color && c.size === size
          );
          next.push(existing || {
            id: null, color, size,
            stock: 0, price: basePrice || '', sku: ''
          });
        });
      });
    } else {
      colors.forEach(color => {
        const existing = combos.find(c => c.color === color && !c.size);
        next.push(existing || {
          id: null, color, size: '',
          stock: 0, price: basePrice || '', sku: ''
        });
      });
    }
    setCombos(next);
    toast.success(`${next.length} variant(s) generated.`);
  };

  const updateCombo = (i, field, value) => {
    setCombos(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  };

  const removeCombo = (i) =>
    setCombos(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">

      {/* ── Colors ── */}
      <div>
        <label className="block text-xs font-bold text-gray-700
                           uppercase tracking-wider mb-2">
          Colors
        </label>
        <div className="flex flex-wrap gap-2 mb-2 min-h-8">
          {colors.length === 0
            ? <p className="text-xs text-gray-400 italic">No colors yet</p>
            : colors.map((color, i) => (
              <span key={color}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5
                               rounded-full text-white text-xs font-semibold"
                    style={{
                      backgroundColor: TAG_COLORS[i % TAG_COLORS.length]
                    }}>
                {color}
                <button type="button" onClick={() => removeColor(color)}
                        className="hover:opacity-70 leading-none">
                  <X size={11} />
                </button>
              </span>
            ))
          }
        </div>
        <div className="flex gap-2">
          <input
            type="text" value={colorInput}
            onChange={e => setColorInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addColor(); }
            }}
            placeholder="e.g. Red, Navy Blue, Ivory…"
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200
                       bg-gray-50 text-sm outline-none focus:ring-2
                       focus:ring-yellow-400"
          />
          <button type="button" onClick={addColor}
                  className="px-4 py-2 rounded-xl text-sm font-semibold
                             flex items-center gap-1 text-white"
                  style={{ backgroundColor: '#3c1a5b' }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* ── Sizes ── */}
      <div>
        <label className="block text-xs font-bold text-gray-700
                           uppercase tracking-wider mb-2">
          Sizes
          <span className="text-gray-400 font-normal normal-case ml-1">
            (optional)
          </span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2 min-h-8">
          {sizes.length === 0
            ? <p className="text-xs text-gray-400 italic">
                No sizes — leave empty for color-only variants
              </p>
            : sizes.map(size => (
              <span key={size}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5
                               rounded-full text-xs font-bold border-2"
                    style={{ borderColor: '#3c1a5b', color: '#3c1a5b' }}>
                {size}
                <button type="button" onClick={() => removeSize(size)}
                        className="hover:opacity-70 leading-none">
                  <X size={11} />
                </button>
              </span>
            ))
          }
        </div>
        <div className="flex gap-2">
          <input
            type="text" value={sizeInput}
            onChange={e => setSizeInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addSize(); }
            }}
            placeholder="e.g. XS, S, M, L, XL, 40, 41, 42…"
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200
                       bg-gray-50 text-sm outline-none focus:ring-2
                       focus:ring-yellow-400"
          />
          <button type="button" onClick={addSize}
                  className="px-4 py-2 rounded-xl text-sm font-semibold
                             flex items-center gap-1 text-white"
                  style={{ backgroundColor: '#3c1a5b' }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* ── Default Price + Generate ── */}
      <div className="flex gap-3 items-end p-4 bg-yellow-50 rounded-xl
                      border border-yellow-200">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Default Price for All Variants (₦)
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="number" value={basePrice}
            onChange={e => setBasePrice(e.target.value)}
            placeholder="Leave empty to use product base price"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200
                       bg-white text-sm outline-none focus:ring-2
                       focus:ring-yellow-400"
          />
        </div>
        <button
          type="button" onClick={generateCombos}
          disabled={colors.length === 0}
          className="px-5 py-2.5 rounded-xl font-bold text-sm
                     flex items-center gap-2 disabled:opacity-50
                     hover:opacity-90 whitespace-nowrap"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          <Layers size={16} />
          Generate Combos
        </button>
      </div>

      {/* ── Combinations Table ── */}
      {combos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-600 uppercase
                          tracking-wider">
              {combos.length} Variant{combos.length !== 1 ? 's' : ''}
            </p>
            <button type="button" onClick={() => setCombos([])}
                    className="text-xs text-red-500 hover:text-red-700
                               font-medium">
              Clear All
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50
                            text-xs font-semibold text-gray-500 uppercase
                            tracking-wider border-b border-gray-200">
              <div className="col-span-3">Color</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-3">Stock</div>
              <div className="col-span-3">Price (₦)</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-gray-100 max-h-80
                            overflow-y-auto">
              {combos.map((combo, i) => (
                <div key={i}
                     className="grid grid-cols-12 gap-2 px-3 py-2.5
                                items-center hover:bg-gray-50">
                  <div className="col-span-3 text-sm font-semibold
                                  text-gray-800 truncate">
                    {combo.color}
                  </div>
                  <div className="col-span-2 text-sm text-gray-500">
                    {combo.size || '—'}
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number" min="0"
                      value={combo.stock}
                      onChange={e => updateCombo(i, 'stock', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border
                                 border-gray-200 text-sm outline-none
                                 focus:ring-2 focus:ring-yellow-400
                                 text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number" min="0" step="0.01"
                      value={combo.price}
                      onChange={e => updateCombo(i, 'price', e.target.value)}
                      placeholder="Base"
                      className="w-full px-2 py-1.5 rounded-lg border
                                 border-gray-200 text-sm outline-none
                                 focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button type="button" onClick={() => removeCombo(i)}
                            className="p-1 rounded text-gray-400
                                       hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {combos.length === 0 && colors.length > 0 && (
        <p className="text-xs text-center text-gray-400 py-2">
          Click "Generate Combos" to create variant combinations.
        </p>
      )}
    </div>
  );
};

// MAIN PAGE
const VendorEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [images, setImages]           = useState([]);
  const [formReady, setFormReady] = useState(false);
  const [variants, setVariants]       = useState([]); 

  const {
    register, handleSubmit, watch,
    reset, formState: { errors }
  } = useForm();

  // Fetch existing product
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['vendor-product', id],
    queryFn: () => getProductById(id),
    select: (res) => res.data.data.product
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    select: (res) => res.data.data.categories
  });

  // Works with both flat arrays (has parent_id) and nested arrays (has children)
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
    // Flat array — build tree then recurse
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

  // Populate form with existing product data
  useEffect(() => {
    if (product && !formReady) {
      reset({
        name:             product.name             || '',
        description:      product.description      || '',
        shortDescription: product.short_description || '',
        categoryId:       product.category_id      || '',
        basePrice:        product.base_price       || '',
        discountPrice:    product.discount_price   || '',
        stockQuantity:    product.stock_quantity   || '',
        sku:              product.sku              || '',
        isFeatured:       product.is_featured      || false,
      });

      if (product.images?.length > 0) {
        setImages(product.images.map(img => ({
          url:       img.url || img.image_url,
          isPrimary: img.is_primary,
          uploading: false
        })));
      }

      setFormReady(true);
    }
  }, [product, formReady, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (payload) => updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-product', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Product updated successfully!');
      navigate('/vendor/products');
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to update product.'
      );
    }
  });

  const onSubmit = (data) => {
    if (images.some(img => img.uploading)) {
      toast.error('Please wait for all images to finish uploading.');
      return;
    }
    const validImages = images.filter(img => img.url && !img.uploading);
    if (validImages.length === 0) {
      toast.error('Please add at least one product image.');
      return;
    }

    updateMutation.mutate({
      name:             data.name,
      description:      data.description,
      shortDescription: data.shortDescription,
      categoryId:       data.categoryId,
      basePrice:        parseFloat(data.basePrice),
      discountPrice:    data.discountPrice
        ? parseFloat(data.discountPrice) : null,
      stockQuantity:    parseInt(data.stockQuantity),
      sku:              data.sku || null,
      brand:            data.brand || null,
      isFeatured:       data.isFeatured,
      images: validImages.map(img => ({
        url: img.url, isPrimary: img.isPrimary
      })),
      variants
    });
  };

  if (productLoading) return <Spinner center />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-500 text-sm mt-1 truncate max-w-sm">
            {product?.name}
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

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <Section title="Basic Information" icon={<Package size={18} />}>
            <div className="space-y-4">
              <Field label="Product Name" required error={errors.name}>
                <input type="text" className={inputClass(errors.name)}
                       {...register('name', {
                         required: 'Product name is required',
                         minLength: { value: 5, message: 'Min 5 characters' }
                       })} />
              </Field>

              <Field label="Short Description" hint="Shown on product cards">
                <input type="text" className={inputClass(false)}
                       {...register('shortDescription')} />
              </Field>

              <Field label="Full Description" required
                     error={errors.description}>
                <textarea rows={6} className={inputClass(errors.description)}
                          {...register('description', {
                            required: 'Description is required'
                          })} />
              </Field>

              <Field label="Category" required error={errors.categoryId}>
                <select className={inputClass(errors.categoryId)}
                        {...register('categoryId', {
                          required: 'Please select a category'
                        })}>
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
                  <input type="number" step="0.01" min="0"
                         className={inputClass(errors.basePrice)}
                         {...register('basePrice', {
                           required: 'Price is required',
                           min: { value: 1, message: 'Must be greater than 0' }
                         })} />
                </Field>

                <Field label="Discount Price (₦)"
                       hint="Leave empty for no discount"
                       error={errors.discountPrice}>
                  <input type="number" step="0.01" min="0"
                         className={inputClass(errors.discountPrice)}
                         {...register('discountPrice', {
                           validate: (value) => {
                             const base = parseFloat(watch('basePrice'));
                             if (value && parseFloat(value) >= base) {
                               return 'Must be less than base price';
                             }
                             return true;
                           }
                         })} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Stock Quantity" required
                       error={errors.stockQuantity}>
                  <input type="number" min="0"
                         className={inputClass(errors.stockQuantity)}
                         {...register('stockQuantity', {
                           required: 'Stock quantity is required',
                           min: { value: 0, message: 'Cannot be negative' }
                         })} />
                </Field>

                <Field label="SKU" hint="Optional internal code">
                  <input type="text" className={inputClass(false)}
                         {...register('sku')} />
                </Field>

                <Field label="Brand" hint="e.g. Apple, Samsung, Nike (optional)">
                  <input type="text" placeholder="Enter brand name"
                         className={inputClass(false)}
                         {...register('brand')} />
                </Field>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4
                                rounded-xl border border-gray-200
                                hover:bg-gray-50 transition-colors">
                <input type="checkbox" className="w-5 h-5 accent-purple-700"
                       {...register('isFeatured')} />
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

          {/* Images */}
          <Section title="Product Images" icon={<Image size={18} />}>
            <ImageUploader images={images} onChange={setImages} />
          </Section>

          {/* Variants — NEW VariantBuilder */}
          <Section title="Product Variants" icon={<Layers size={18} />}>
            <p className="text-xs text-gray-500 mb-5">
              Add colors and sizes, then click <strong>Generate Combos</strong> to
              create all combinations. Set stock quantity per combination.
            </p>
            {/* Only mount once product has loaded so initialVariants is correct */}
            {formReady && (
              <VariantBuilder
                initialVariants={product?.variants || []}
                onChange={setVariants}
              />
            )}
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100
                          shadow-sm p-5 sticky top-24">
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Save Changes
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Changes will be visible to customers immediately.
            </p>

            {/* Variant count summary */}
            {variants.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Variants ready</span>
                  <span className="font-bold" style={{ color: '#3c1a5b' }}>
                    {variants.length}
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">Images</span>
                  <span className="font-bold text-gray-700">
                    {images.filter(i => !i.uploading).length}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit(onSubmit)}
              disabled={
                updateMutation.isPending ||
                images.some(img => img.uploading)
              }
              className="w-full py-4 rounded-xl font-bold text-sm
                         flex items-center justify-center gap-2
                         transition-all hover:opacity-90
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
            >
              {updateMutation.isPending ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"
                       fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z" />
                </svg>Saving...</>
              ) : images.some(img => img.uploading) ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"
                       fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z" />
                </svg>Uploading Images...</>
              ) : (
                <><Upload size={18} />Save Changes</>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorEditProductPage;