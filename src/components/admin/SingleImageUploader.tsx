import React, { useState } from 'react';
import { UploadCloud, X, Loader2, Link2, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../../services/storageService';

interface SingleImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  recommendedSize?: string;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
}

export const SingleImageUploader: React.FC<SingleImageUploaderProps> = ({
  value,
  onChange,
  folder = 'uploads',
  label = 'Upload Image from Device (PC / Mobile)',
  recommendedSize = 'Recommended: 1200x600 px',
  maxWidth,
  maxHeight,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputVal, setUrlInputVal] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(10);
    setErrorMsg('');

    try {
      const url = await uploadImage(
        file,
        folder,
        (p) => setProgress(p),
        { maxWidth, maxHeight }
      );
      onChange(url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInputVal.trim()) {
      onChange(urlInputVal.trim());
      setUrlInputVal('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-brand-secondary hover:underline flex items-center gap-1 font-medium"
        >
          <Link2 className="w-3 h-3" />
          <span>{showUrlInput ? 'Hide URL input' : 'Paste Image URL instead'}</span>
        </button>
      </div>

      {/* Optional URL Paste Input */}
      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="flex gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="url"
            placeholder="https://... direct image link"
            value={urlInputVal}
            onChange={(e) => setUrlInputVal(e.target.value)}
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 outline-none"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            Use Link
          </button>
        </form>
      )}

      {/* Main Upload Dropzone or Image Preview */}
      {value ? (
        <div className="relative rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-900 group">
          <div className="h-40 sm:h-48 w-full flex items-center justify-center bg-slate-900/40 p-2">
            <img
              src={value}
              alt="Uploaded Preview"
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          </div>

          {/* Action Overlay */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="truncate max-w-[200px] sm:max-w-xs font-mono text-[11px] text-slate-500">
              {value.startsWith('data:') ? 'Image uploaded from device (Optimized)' : value}
            </span>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-xs font-bold text-brand-primary hover:underline cursor-pointer">
                Change Picture
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative border-2 border-dashed border-slate-300 hover:border-brand-primary rounded-2xl p-6 text-center transition-colors bg-slate-50/50 hover:bg-slate-50">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            aria-label="Upload image from device"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-2" />
              <p className="text-xs font-bold text-slate-800">Processing & Uploading from Device...</p>
              <div className="w-48 bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-brand-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600 mb-2">
                <UploadCloud className="w-6 h-6 text-brand-primary" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Tap or click to upload from your PC or Mobile
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports JPG, PNG, WEBP, Camera photos ({recommendedSize})
              </p>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
