import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Eye, EyeOff, X, Save, Image, Upload } from 'lucide-react';
import { uploadToImgBB } from '../../utils/uploadToImgBB';
import { getCarousel, createSlide, updateSlide, deleteSlide } from '../../api/admin.api';
import Spinner from '../../components/common/Spinner';

// SLIDE FORM MODAL
const SlideModal = ({ slide, onClose, onSave, isSaving }) => {
  const isEdit = !!slide?.id;
  const [form, setForm] = useState({
    imageUrl:    slide?.image_url    || '',
    headline:    slide?.headline     || '',
    description: slide?.description  || '',
    badge:       slide?.badge        || '',
    buttonText:  slide?.button_text  || 'Shop Now',
    link:        slide?.link         || '/products',
    position:    slide?.position     || 'left',
    sortOrder:   slide?.sort_order   ?? 0,
    isActive:    slide?.is_active    ?? true,
  });

  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(slide?.image_url || '');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-yellow-400";

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const url = await uploadToImgBB(file);
      set('imageUrl', url);
      setPreviewUrl(url);
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err.message || 'Image upload failed');
      setPreviewUrl(slide?.image_url || '');
    } finally {
      setUploading(false);
    }
  };

  const canSave = (isEdit || form.imageUrl) && !uploading && !isSaving;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? 'Edit Slide' : 'Add New Slide'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Slide Image {!isEdit && <span className="text-red-400">*</span>}
              {isEdit && <span className="text-gray-400 font-normal ml-1">(leave unchanged to keep current)</span>}
            </label>

            {/* Preview */}
            <div className="relative rounded-xl overflow-hidden h-40 bg-gray-100 mb-2
                            border-2 border-dashed border-gray-200">
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview"
                       className="w-full h-full object-cover"
                       onError={(e) => { e.target.style.display = 'none'; }} />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col
                                    items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent
                                      rounded-full animate-spin" />
                      <span className="text-white text-xs font-semibold">Uploading...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2
                                text-gray-400">
                  <Image size={28} />
                  <span className="text-xs">No image selected</span>
                </div>
              )}
            </div>

            {/* File picker button */}
            <label className="flex items-center justify-center gap-2 w-full py-2.5
                              rounded-xl border-2 border-dashed border-gray-300
                              text-sm font-semibold text-gray-600 cursor-pointer
                              hover:border-purple-400 hover:text-purple-600
                              hover:bg-purple-50 transition-colors">
              <Upload size={16} />
              {uploading ? 'Uploading to ImgBB...' : 'Choose Image from Device'}
              <input type="file" accept="image/*" className="hidden"
                     onChange={handleFileChange} disabled={uploading} />
            </label>
            <p className="mt-1.5 text-xs text-gray-400 text-center">
              Images are uploaded to ImgBB automatically. Max 32MB.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Headline</label>
            <input type="text" className={inputClass}
                   placeholder="e.g. Flash Sale up to 50% off"
                   value={form.headline}
                   onChange={e => set('headline', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
            <input type="text" className={inputClass}
                   placeholder="Optional subtitle text"
                   value={form.description}
                   onChange={e => set('description', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Badge <span className="text-gray-400 font-normal">(optional pill text)</span>
            </label>
            <input type="text" className={inputClass}
                   placeholder="e.g. LIMITED TIME OFFER"
                   value={form.badge}
                   onChange={e => set('badge', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Button Text</label>
              <input type="text" className={inputClass}
                     placeholder="Shop Now"
                     value={form.buttonText}
                     onChange={e => set('buttonText', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Button Link</label>
              <input type="text" className={inputClass}
                     placeholder="/products?category"
                     value={form.link}
                     onChange={e => set('link', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Text Position</label>
              <select className={inputClass}
                      value={form.position}
                      onChange={e => set('position', e.target.value)}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sort Order</label>
              <input type="number" className={inputClass} min="0"
                     value={form.sortOrder}
                     onChange={e => set('sortOrder', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl
                            border border-gray-200 hover:bg-gray-50">
            <input type="checkbox" className="w-4 h-4 accent-purple-700"
                   checked={form.isActive}
                   onChange={e => set('isActive', e.target.checked)} />
            <span className="text-sm font-medium text-gray-700">Active (visible on homepage)</span>
          </label>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200
                             text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold
                       flex items-center justify-center gap-2
                       transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
          >
            <Save size={15} />
            {uploading ? 'Uploading...' : isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Slide'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
const AdminCarouselPage = () => {
  const queryClient = useQueryClient();
  const [modalSlide, setModalSlide] = useState(null);

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['admin-carousel'],
    queryFn: getCarousel,
    select: (res) => res.data.data.slides,
  });

  const createMutation = useMutation({
    mutationFn: createSlide,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-carousel'] });
      queryClient.invalidateQueries({ queryKey: ['carousel'] });
      toast.success('Slide added!');
      setModalSlide(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add slide.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSlide(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-carousel'] });
      queryClient.invalidateQueries({ queryKey: ['carousel'] });
      toast.success('Slide updated!');
      setModalSlide(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update slide.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSlide,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-carousel'] });
      queryClient.invalidateQueries({ queryKey: ['carousel'] });
      toast.success('Slide deleted.');
    },
    onError: () => toast.error('Failed to delete slide.'),
  });

  const toggleActive = (slide) => {
    updateMutation.mutate({
      id: slide.id,
      data: { isActive: !slide.is_active }
    });
  };

  const handleSave = (form) => {
    const payload = {
      headline:    form.headline    || null,
      description: form.description || null,
      badge:       form.badge       || null,
      buttonText:  form.buttonText,
      link:        form.link,
      position:    form.position,
      sortOrder:   form.sortOrder,
      isActive:    form.isActive,
    };
    // Only send imageUrl if a new one was uploaded
    if (form.imageUrl) payload.imageUrl = form.imageUrl;

    if (modalSlide?.id) {
      updateMutation.mutate({ id: modalSlide.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Carousel</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage the hero slides shown on the homepage
          </p>
        </div>
        <button
          onClick={() => setModalSlide({})}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     font-bold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
        >
          <Plus size={18} /> Add Slide
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        {[
          { label: 'Total Slides', value: slides.length },
          { label: 'Active', value: slides.filter(s => s.is_active).length },
          { label: 'Hidden', value: slides.filter(s => !s.is_active).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100
                                      shadow-sm px-5 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-extrabold" style={{ color: '#3c1a5b' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Slides Grid */}
      {isLoading ? <Spinner center /> : slides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                        py-16 text-center">
          <Image size={40} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium mb-1">No slides yet</p>
          <p className="text-gray-400 text-sm">Add your first carousel slide</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {slides.map((slide) => (
            <div key={slide.id}
                 className={`bg-white rounded-2xl border shadow-sm overflow-hidden
                             transition-opacity ${slide.is_active ? 'opacity-100' : 'opacity-60'}
                             ${slide.is_active ? 'border-gray-100' : 'border-dashed border-gray-300'}`}>

              {/* Image Preview */}
              <div className="relative h-40 bg-gray-100">
                {slide.image_url ? (
                  <img src={slide.image_url} alt={slide.headline || 'Slide'}
                       className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={32} className="text-gray-300" />
                  </div>
                )}
                {/* Overlay badges */}
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                {slide.badge && (
                  <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1
                                   rounded-md text-white bg-yellow-500">
                    {slide.badge}
                  </span>
                )}
                {!slide.is_active && (
                  <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1
                                   rounded-md bg-gray-800 text-white">
                    Hidden
                  </span>
                )}
                <div className="absolute bottom-3 left-3 text-white">
                  {slide.headline && (
                    <p className="font-bold text-sm drop-shadow">{slide.headline}</p>
                  )}
                  {slide.description && (
                    <p className="text-xs opacity-80 drop-shadow">{slide.description}</p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100
                                     px-2 py-1 rounded-lg">
                      Order: {slide.sort_order}
                    </span>
                    <span className="text-xs text-gray-500 truncate max-w-32">
                      → {slide.link}
                    </span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: '#3c1a5b' }}>
                    {slide.button_text}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`flex-1 flex items-center justify-center gap-1.5
                                py-2 rounded-lg text-xs font-semibold transition-colors
                                ${slide.is_active
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {slide.is_active
                      ? <><Eye size={13} /> Active</>
                      : <><EyeOff size={13} /> Hidden</>
                    }
                  </button>
                  <button
                    onClick={() => setModalSlide(slide)}
                    className="flex-1 flex items-center justify-center gap-1.5
                               py-2 rounded-lg text-xs font-semibold bg-blue-50
                               text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this slide?')) {
                        deleteMutation.mutate(slide.id);
                      }
                    }}
                    className="py-2 px-3 rounded-lg text-xs font-semibold
                               bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalSlide !== null && (
        <SlideModal
          slide={modalSlide}
          onClose={() => setModalSlide(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default AdminCarouselPage;