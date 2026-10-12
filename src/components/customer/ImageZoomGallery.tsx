import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface ImageZoomGalleryProps {
  images: string[];
  productName: string;
  discountPercent?: number;
}

export const ImageZoomGallery: React.FC<ImageZoomGalleryProps> = ({
  images,
  productName,
  discountPercent,
}) => {
  const imageList = images && images.length > 0 ? images : ['/logo.png'];
  const [activeImage, setActiveImage] = useState(imageList[0]);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [isHovered, setIsHovered] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // Sync active image if images prop changes
  React.useEffect(() => {
    if (images && images.length > 0) {
      setActiveImage(images[0]);
    }
  }, [images]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.85)',
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setZoomStyle({ transform: 'scale(1)' });
  };

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row gap-4">
        {/* Thumbnails */}
        {imageList.length > 1 && (
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[500px] py-1">
            {imageList.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl p-1 bg-white border-2 flex-shrink-0 transition-all ${
                  activeImage === img
                    ? 'border-brand-primary shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img
                  src={img}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image with Zoom and Top Badges */}
        <div
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex-1 aspect-square bg-white border border-slate-200/80 rounded-2xl overflow-hidden relative flex items-center justify-center p-6 sm:p-10 cursor-crosshair select-none group shadow-2xs"
        >
          {/* Top Left: SAVE X% Badge (Matching Reference Screenshot) */}
          {discountPercent && discountPercent > 0 ? (
            <span className="absolute top-4 left-4 z-10 bg-[#0b0d13] text-white text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-md tracking-wider uppercase shadow-xs">
              SAVE {discountPercent}%
            </span>
          ) : null}

          {/* Top Right: Search / Zoom Icon Button (Matching Reference Screenshot) */}
          <button
            type="button"
            onClick={() => setShowLightbox(true)}
            aria-label="View Full Image"
            className="absolute top-4 right-4 z-10 p-2 rounded-full text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 transition-colors shadow-2xs border border-slate-200/60"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
          </button>

          <img
            src={activeImage}
            alt={productName}
            style={isHovered ? zoomStyle : undefined}
            className="max-h-full max-w-full object-contain transition-transform duration-100 ease-out pointer-events-none"
          />
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl p-4 sm:p-6 overflow-hidden flex flex-col items-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImage}
              alt={productName}
              className="max-h-[75vh] max-w-full object-contain"
            />
            <p className="mt-3 text-xs sm:text-sm font-bold text-slate-800 text-center">{productName}</p>
          </div>
        </div>
      )}
    </>
  );
};
