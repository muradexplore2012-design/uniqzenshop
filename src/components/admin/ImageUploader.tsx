import React, { useState } from 'react';
import { UploadCloud, X, Star, Loader2, Link2, Plus } from 'lucide-react';
import { uploadImage } from '../../services/storageService';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  thumbnail?: string;
  onThumbnailChange?: (thumb: string) => void;
  folder?: string;
  maxFiles?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images = [],
  onChange,
  thumbnail,
  onThumbnailChange,
  folder = 'products',
  maxFiles = 6,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputVal, setUrlInputVal] = useState('');

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxFiles) {
      setErrorMsg(`Maximum ${maxFiles} images allowed. Currently have ${images.length}.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrorMsg('');

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadImage(file, folder, (p) => {
          setProgress(Math.round(((i + p / 100) / files.length) * 100));
        });
        uploadedUrls.push(url);
      }

      const newImages = [...images, ...uploadedUrls];
      onChange(newImages);

      // If no thumbnail set, default to first uploaded
      if (!thumbnail && onThumbnailChange && newImages.length > 0) {
        onThumbnailChange(newImages[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload image(s). Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInputVal.trim()) return;

    if (images.length >= maxFiles) {
      setErrorMsg(`Maximum ${maxFiles} images allowed.`);
      return;
    }

    const newImages = [...images, urlInputVal.trim()];
    onChange(newImages);
    if (!thumbnail && onThumbnailChange) {
      onThumbnailChange(urlInputVal.trim());
    }
    setUrlInputVal('');
    setShowUrlInput(false);
    setErrorMsg('');
  };

  const handleRemove = (url: string) => {
    const updated = images.filter((img) => img !== url);
    onChange(updated);
    if (thumbnail === url && onThumbnailChange) {
      onThumbnailChange(updated[0] || '');
    }
  };

  const handleSetThumbnail = (url: string) => {
    if (onThumbnailChange) {
      onThumbnailChange(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div className="relative border-2 border-dashed border-slate-300 hover:border-brand-primary rounded-2xl p-6 text-center transition-colors bg-slate-50/50 hover:bg-slate-50">
        <input
          type="file"
          id="gadget-file-upload"
          multiple
          accept="image/*"
          onChange={handleFiles}
          disabled={uploading || images.length >= maxFiles}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          aria-label="Upload product images"
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-2">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-2" />
            <p className="text-sm font-semibold text-slate-700">Uploading & Optimizing Images...</p>
            <div className="w-48 bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-brand-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 mt-1 font-mono">{progress}%</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 mb-2">
              <UploadCloud className="w-6 h-6 text-brand-primary" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Tap or click to upload photos from PC or Mobile device
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports Camera photos, JPG, PNG, WEBP (Auto-optimized)
            </p>
            <span className="text-[11px] text-slate-500 mt-2 font-semibold bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
              {images.length} / {maxFiles} images
            </span>
          </div>
        )}
      </div>

      {/* Alternative URL button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs font-semibold text-brand-secondary hover:underline flex items-center gap-1.5"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>{showUrlInput ? 'Hide URL Input' : 'Or add image via web URL'}</span>
        </button>

        <span className="text-[11px] text-slate-400">
          Star icon sets main cover photo
        </span>
      </div>

      {showUrlInput && (
        <form onSubmit={handleAddUrl} className="flex gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="url"
            placeholder="https://... paste image URL"
            value={urlInputVal}
            onChange={(e) => setUrlInputVal(e.target.value)}
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 outline-none"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Image Gallery Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {images.map((img, idx) => {
            const isThumb = thumbnail === img || (!thumbnail && idx === 0);
            return (
              <div
                key={idx}
                className={`relative aspect-square rounded-xl bg-white border-2 overflow-hidden group p-1 ${
                  isThumb ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-slate-200'
                }`}
              >
                <img
                  src={img}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-contain mix-blend-multiply"
                />

                {/* Primary Thumbnail Tag */}
                {isThumb && (
                  <span className="absolute bottom-1 left-1 right-1 bg-brand-primary text-white text-[9px] font-bold text-center py-0.5 rounded shadow-xs uppercase">
                    Main Cover
                  </span>
                )}

                {/* Controls Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!isThumb && onThumbnailChange && (
                    <button
                      type="button"
                      onClick={() => handleSetThumbnail(img)}
                      className="p-1.5 rounded-full bg-white/90 text-amber-500 hover:bg-white"
                      title="Set as Main Cover"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(img)}
                    className="p-1.5 rounded-full bg-white/90 text-rose-600 hover:bg-white"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
