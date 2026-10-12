import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '../../types/banner';

interface HeroBannerSliderProps {
  banners: Banner[];
  loading?: boolean;
}

const DEFAULT_HERO_SLIDES = [
  {
    id: 'default-slide-1',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=1600&auto=format&fit=crop',
    link: '/shop?category=smartphones',
    alt: 'Next-Gen Smartphones',
  },
  {
    id: 'default-slide-2',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1600&auto=format&fit=crop',
    link: '/shop?category=audio-gadgets',
    alt: 'Wireless Audio Banner',
  },
];

const DEFAULT_TOP_IMAGE = 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=800&auto=format&fit=crop';
const DEFAULT_BOTTOM_IMAGE = 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?q=80&w=800&auto=format&fit=crop';

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ banners = [], loading = false }) => {
  // 1. Separate Main Hero Slider Banners from Right Side Posters
  const heroBanners = banners.filter((b) => !b.position || b.position === 'hero');
  const topSideBanner = banners.find((b) => b.position === 'side_top');
  const bottomSideBanner = banners.find((b) => b.position === 'side_bottom');

  const activeSlides =
    heroBanners.length > 0
      ? heroBanners.map((b) => ({
          id: b.id,
          image: b.image,
          link: b.buttonLink || '/shop',
          alt: b.title || 'Promotion Banner',
        }))
      : DEFAULT_HERO_SLIDES;

  const topPoster = {
    image: topSideBanner?.image || DEFAULT_TOP_IMAGE,
    link: topSideBanner?.buttonLink || '/shop?category=audio-gadgets',
    alt: topSideBanner?.title || 'Top Promotional Poster',
  };

  const bottomPoster = {
    image: bottomSideBanner?.image || DEFAULT_BOTTOM_IMAGE,
    link: bottomSideBanner?.buttonLink || '/shop?category=monitors',
    alt: bottomSideBanner?.title || 'Bottom Promotional Poster',
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const slideInterval = useRef<any>(null);

  // Auto-play timer for main slider
  useEffect(() => {
    if (activeSlides.length <= 1) return;

    if (!isHovered) {
      slideInterval.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
      }, 4500);
    }

    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, [isHovered, activeSlides.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  // If loading and we don't have any cached slides yet, show skeleton to avoid flashing dummy slides
  if (loading && banners.length === 0) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
          <div className="lg:col-span-3 rounded-xl sm:rounded-3xl bg-slate-900 animate-pulse aspect-[21/9] lg:aspect-[16/7.5]" />
          <div className="hidden lg:grid grid-rows-2 gap-4 sm:gap-5 h-full">
            <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-slate-900 animate-pulse" />
            <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-slate-900 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
        {/* =========================================================================
            LEFT COLUMN: MAIN HERO SLIDER (COL-SPAN 3)
           ========================================================================= */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="lg:col-span-3 relative rounded-xl sm:rounded-3xl overflow-hidden bg-slate-950 aspect-[21/9] lg:aspect-[16/7.5] shadow-elevated group select-none"
        >
          {activeSlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  isActive
                    ? 'opacity-100 z-10 scale-100'
                    : 'opacity-0 z-0 scale-105 pointer-events-none'
                }`}
              >
                <Link to={slide.link} className="block w-full h-full cursor-pointer">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="w-full h-full object-cover object-center"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </Link>
              </div>
            );
          })}

          {/* Previous / Next Arrow Controls */}
          {activeSlides.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Slide"
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Slide"
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>

              {/* Bottom Pagination Dots */}
              <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 z-20 flex items-center justify-center space-x-1.5 sm:space-x-2">
                {activeSlides.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    aria-label={`Go to slide ${dotIdx + 1}`}
                    onClick={() => setCurrentIndex(dotIdx)}
                    className={`h-1.5 sm:h-2 transition-all duration-300 rounded-full ${
                      dotIdx === currentIndex
                        ? 'w-5 sm:w-7 bg-white shadow-md'
                        : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* =========================================================================
            RIGHT COLUMN: STACKED SIDE PROMOTIONAL POSTERS (PURE POSTER IMAGES ONLY)
           ========================================================================= */}
        <div className="hidden lg:grid grid-rows-2 gap-4 sm:gap-5 h-full">
          {/* 1. TOP SIDE POSTER (PURE IMAGE) */}
          <Link
            to={topPoster.link}
            className="relative w-full h-full min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 shadow-elevated group border border-slate-800 transition-all duration-300 hover:scale-[1.01] block select-none"
          >
            <img
              src={topPoster.image}
              alt={topPoster.alt}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* 2. BOTTOM SIDE POSTER (PURE IMAGE) */}
          <Link
            to={bottomPoster.link}
            className="relative w-full h-full min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 shadow-elevated group border border-slate-800 transition-all duration-300 hover:scale-[1.01] block select-none"
          >
            <img
              src={bottomPoster.image}
              alt={bottomPoster.alt}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};
