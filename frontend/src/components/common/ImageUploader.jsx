import { useState, useRef } from 'react';
import { Upload, Link, X, Star, Image, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const uploadToImgBB = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Upload failed');
  }

  return data.data.url;
};

const ImageCard = ({ image, index, onRemove, onSetPrimary }) => {
  return (
    <div className={`relative rounded-2xl overflow-hidden border-2
                     transition-all group
                     ${image.isPrimary
                       ? 'shadow-md'
                       : 'border-gray-200'}`}
         style={image.isPrimary ? { borderColor: '#3c1a5b' } : {}}>

      <div className="aspect-square bg-gray-100">
        {image.uploading ? (
          <div className="w-full h-full flex flex-col items-center
                          justify-center gap-2">
            <Loader size={24} className="animate-spin"
                    style={{ color: '#3c1a5b' }} />
            <p className="text-xs text-gray-500">Uploading...</p>
          </div>
        ) : (
          <img
            src={image.url}
            alt={`Product image ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '';
              e.target.parentElement.innerHTML =
                '<div class="w-full h-full flex items-center justify-center text-gray-300 text-xs">Invalid URL</div>';
            }}
          />
        )}
      </div>

      {!image.uploading && (
        <div className="absolute inset-0 bg-black/40 opacity-0
                        group-hover:opacity-100 transition-opacity
                        flex items-center justify-center gap-2">
          {!image.isPrimary && (
            <button
              type="button"
              onClick={() => onSetPrimary(index)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold
                         bg-yellow-400 text-purple-900 hover:bg-yellow-300
                         transition-colors"
            >
              Set Primary
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg bg-red-500 text-white
                       hover:bg-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Primary Badge */}
      {image.isPrimary && !image.uploading && (
        <div className="absolute top-2 left-2 flex items-center gap-1
                        px-2 py-1 rounded-lg text-xs font-bold text-white"
             style={{ backgroundColor: '#3c1a5b' }}>
          <Star size={10} fill="white" stroke="none" />
          Primary
        </div>
      )}
    </div>
  );
};

// MAIN IMAGE UPLOADER COMPONENT
const ImageUploader = ({ images, onChange }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Add image to list
  const addImage = (url, isPrimary = false) => {
    const newImage = {
      url,
      isPrimary: images.length === 0 || isPrimary,
      uploading: false
    };

    if (images.length === 0) {
      onChange([{ ...newImage, isPrimary: true }]);
    } else {
      onChange([...images, newImage]);
    }
  };

  // Handle file upload
  const handleFiles = async (files) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add placeholder cards with uploading state
    const placeholders = validFiles.map((_, i) => ({
      url: '',
      isPrimary: images.length === 0 && i === 0,
      uploading: true
    }));

    const startIndex = images.length;
    onChange([...images, ...placeholders]);

    // Upload each file
    for (let i = 0; i < validFiles.length; i++) {
      try {
        const url = await uploadToImgBB(validFiles[i]);
        onChange(prev => {
          const updated = [...prev];
          updated[startIndex + i] = {
            url,
            isPrimary: startIndex === 0 && i === 0,
            uploading: false
          };
          return updated;
        });
        toast.success(`Image ${i + 1} uploaded!`);
      } catch (error) {
        toast.error(`Failed to upload ${validFiles[i].name}`);
        onChange(prev => prev.filter((_, idx) => idx !== startIndex + i));
      }
    }
  };

  // Handle URL input
  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid image URL.');
      return;
    }

    addImage(url);
    setUrlInput('');
    toast.success('Image added!');
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Remove image
  const handleRemove = (index) => {
    const updated = images.filter((_, i) => i !== index);
    // Reassign primary to first image if primary was removed
    if (updated.length > 0 && !updated.some(img => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  // Set primary
  const handleSetPrimary = (index) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                      font-medium transition-all ${
            activeTab === 'upload'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Upload size={15} />
          Upload Files
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                      font-medium transition-all ${
            activeTab === 'url'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Link size={15} />
          From URL
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div>
          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8
                        text-center cursor-pointer transition-all
                        ${isDragging
                          ? 'border-yellow-400 bg-yellow-50 scale-[1.01]'
                          : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'}`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center
                              justify-center"
                   style={{ backgroundColor: '#f5f0fa' }}>
                <Image size={28} style={{ color: '#3c1a5b' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {isDragging
                    ? 'Drop images here!'
                    : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, WEBP up to 10MB each
                </p>
              </div>
              <span className="px-4 py-2 rounded-xl text-xs font-bold
                               text-white"
                    style={{ backgroundColor: '#3c1a5b' }}>
                Choose Files
              </span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>
      )}

      {/* URL Tab */}
      {activeTab === 'url' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Paste a direct link to an image from any website.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
              placeholder="https://example.com/product-image.jpg"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200
                         bg-gray-50 text-sm outline-none focus:ring-2
                         focus:ring-yellow-400 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={!urlInput.trim()}
              className="px-5 py-3 rounded-xl font-bold text-sm
                         transition-all hover:opacity-90 flex-shrink-0
                         disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ffc70e', color: '#3c1a5b' }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-3">
            {images.length} {images.length === 1 ? 'image' : 'images'} added
            — hover to remove or set as primary
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <ImageCard
                key={index}
                image={image}
                index={index}
                onRemove={handleRemove}
                onSetPrimary={handleSetPrimary}
              />
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          No images added yet. Upload files or add image URLs above.
        </p>
      )}
    </div>
  );
};

export default ImageUploader;