import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  LayoutTemplate,
  Columns2,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { EmptyState } from '../../components/common/EmptyState';
import {
  getAllBannersAdmin,
  saveBanner,
  saveSidePoster,
  deleteBanner,
} from '../../services/bannerService';
import { Banner } from '../../types/banner';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';
import { SingleImageUploader } from '../../components/admin/SingleImageUploader';

const DEFAULT_TOP_IMG = 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=800&auto=format&fit=crop';
const DEFAULT_BOTTOM_IMG = 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?q=80&w=800&auto=format&fit=crop';

export const AdminBannersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'hero' (Main Slider) vs 'side' (2 Side Posters)
  const [activeTab, setActiveTab] = useState<'hero' | 'side'>('hero');

  // Hero Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [image, setImage] = useState('');
  const [buttonText, setButtonText] = useState('Shop Now');
  const [buttonLink, setButtonLink] = useState('/shop');
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // Side Posters State (Top Poster & Bottom Poster)
  const [topPosterImage, setTopPosterImage] = useState(DEFAULT_TOP_IMG);
  const [topPosterLink, setTopPosterLink] = useState('/shop?category=audio-gadgets');
  const [topPosterActive, setTopPosterActive] = useState(true);

  const [bottomPosterImage, setBottomPosterImage] = useState(DEFAULT_BOTTOM_IMG);
  const [bottomPosterLink, setBottomPosterLink] = useState('/shop?category=monitors');
  const [bottomPosterActive, setBottomPosterActive] = useState(true);

  const [savingSide, setSavingSide] = useState(false);
  const [sideSuccessMsg, setSideSuccessMsg] = useState('');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    const data = await getAllBannersAdmin();
    setBanners(data);

    // Populate Top Side Poster state
    const top = data.find((b) => b.position === 'side_top' || b.id === 'side_top');
    if (top) {
      if (top.image) setTopPosterImage(top.image);
      if (top.buttonLink) setTopPosterLink(top.buttonLink);
      setTopPosterActive(top.active !== undefined ? top.active : true);
    }

    // Populate Bottom Side Poster state
    const bottom = data.find((b) => b.position === 'side_bottom' || b.id === 'side_bottom');
    if (bottom) {
      if (bottom.image) setBottomPosterImage(bottom.image);
      if (bottom.buttonLink) setBottomPosterLink(bottom.buttonLink);
      setBottomPosterActive(bottom.active !== undefined ? bottom.active : true);
    }

    setLoading(false);
  };

  const heroBanners = banners.filter(
    (b) => !b.position || b.position === 'hero'
  );

  const handleOpenNew = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setTagline('');
    setImage('');
    setButtonText('Shop Now');
    setButtonLink('/shop');
    setActive(true);
    setSortOrder(heroBanners.length);
    setShowModal(true);
  };

  const handleOpenEdit = (b: Banner) => {
    setEditingId(b.id);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setTagline(b.tagline || '');
    setImage(b.image || '');
    setButtonText(b.buttonText || 'Shop Now');
    setButtonLink(b.buttonLink || '/shop');
    setActive(b.active);
    setSortOrder(b.sortOrder || 0);
    setShowModal(true);
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !image.trim()) {
      alert('Please provide a banner title and upload an image.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Banner> = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        tagline: tagline.trim(),
        image: image.trim(),
        buttonText: buttonText.trim(),
        buttonLink: buttonLink.trim(),
        position: 'hero',
        active,
        sortOrder: Number(sortOrder) || 0,
      };

      const savedId = await saveBanner(payload, editingId || undefined);

      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          editingId ? 'banner.edit' : 'banner.create',
          'banner',
          savedId,
          { title },
          currentUser.email || ''
        );
      }

      setShowModal(false);
      await loadBanners();
    } catch (e) {
      alert('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, bTitle: string) => {
    if (!window.confirm(`Delete banner "${bTitle}"?`)) return;
    try {
      await deleteBanner(id);
      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          'banner.delete',
          'banner',
          id,
          { title: bTitle },
          currentUser.email || ''
        );
      }
      await loadBanners();
    } catch (e) {
      alert('Failed to delete banner');
    }
  };

  const handleSaveSidePosters = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSide(true);
    setSideSuccessMsg('');

    try {
      // 1. Save Top Poster (pure image)
      await saveSidePoster('side_top', {
        title: 'Top Promotional Poster',
        image: topPosterImage.trim() || DEFAULT_TOP_IMG,
        link: topPosterLink.trim() || '/shop?category=audio-gadgets',
        active: topPosterActive,
      });

      // 2. Save Bottom Poster (pure image)
      await saveSidePoster('side_bottom', {
        title: 'Bottom Promotional Poster',
        image: bottomPosterImage.trim() || DEFAULT_BOTTOM_IMG,
        link: bottomPosterLink.trim() || '/shop?category=monitors',
        active: bottomPosterActive,
      });

      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          'banner.side_posters.update',
          'banner',
          'side_posters',
          { topLink: topPosterLink, bottomLink: bottomPosterLink },
          currentUser.email || ''
        );
      }

      setSideSuccessMsg('Both side promotional posters saved and updated live!');
      setTimeout(() => setSideSuccessMsg(''), 4500);
      await loadBanners();
    } catch (err: any) {
      alert('Failed to save side posters: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingSide(false);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Homepage Banners & Posters — Admin Portal | Uniqzen Shop" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Homepage Banners & Posters</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control the main hero slider and right-side promotional posters displayed on the storefront.
          </p>
        </div>

        {activeTab === 'hero' && (
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hero Banner</span>
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'hero'
              ? 'border-brand-primary text-brand-primary bg-slate-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>Main Hero Slider ({heroBanners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('side')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'side'
              ? 'border-brand-primary text-brand-primary bg-slate-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Columns2 className="w-4 h-4" />
          <span>Side Promotional Posters (2 Posters)</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MAIN HERO SLIDER BANNERS
         ========================================================================= */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading hero banners...</div>
          ) : heroBanners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {heroBanners.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle flex flex-col justify-between group"
                >
                  <div className="h-44 sm:h-52 bg-slate-900 relative overflow-hidden flex items-center justify-center p-2 text-white">
                    {b.image ? (
                      <img
                        src={b.image}
                        alt={b.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    )}
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                        b.active ? 'bg-emerald-500/90 text-white' : 'bg-slate-700/80 text-slate-300'
                      }`}
                    >
                      {b.active ? 'Active' : 'Hidden'}
                    </span>
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Order: {b.sortOrder || 0}
                    </span>
                  </div>

                  <div className="p-5 flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{b.title}</h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        Link: <span className="font-mono">{b.buttonLink || '/shop'}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-2 rounded-xl text-slate-600 hover:text-brand-primary hover:bg-slate-100 transition-colors"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.title)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ImageIcon}
              title="No hero slider banners configured yet"
              description="Create your hero banners to showcase promotions and gadget launches on the storefront homepage."
              actionLabel="Add Hero Banner"
              onActionClick={handleOpenNew}
            />
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: DEDICATED SIDE PROMOTIONAL POSTERS SECTION (PURE IMAGES ONLY)
         ========================================================================= */}
      {activeTab === 'side' && (
        <form onSubmit={handleSaveSidePosters} className="space-y-6">
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-800 leading-relaxed flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">সাইড পোস্টার আপলোড:</p>
              <p className="mt-0.5">
                আপনার তৈরি করা সম্পূর্ণ পোস্টার ছবি সরাসরি পিসি বা মোবাইল থেকে আপলোড করুন। পোস্টারের ওপর কোনো অতিরিক্ত টেক্সট বা বাটন থাকবে না—শুধুমাত্র আপনার দেওয়া পোস্টার ছবিটিই নিখুঁতভাবে প্রদর্শিত হবে। ব্যানারে ক্লিক করলে কোন পেজে যাবে তার জন্য Click Destination Link সেট করুন।
              </p>
            </div>
          </div>

          {sideSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{sideSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* =================================================================
                CARD 1: TOP SIDE POSTER
               ================================================================= */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">1. Top Side Poster (উপরের পোস্টার)</h2>
                  <p className="text-[11px] text-slate-400">Position: Right top corner beside hero slider</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 uppercase">
                  Top Position
                </span>
              </div>

              <div>
                <SingleImageUploader
                  value={topPosterImage}
                  onChange={setTopPosterImage}
                  folder="banners"
                  label="Upload Top Poster Image (PC / Mobile)"
                  recommendedSize="800 x 450 px (Landscape / 16:9 ratio)"
                  maxWidth={1200}
                  maxHeight={700}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Click URL / Destination (ক্লিক করলে কোন পেজে যাবে)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /shop?category=audio-gadgets"
                  value={topPosterLink}
                  onChange={(e) => setTopPosterLink(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="top_poster_active"
                  checked={topPosterActive}
                  onChange={(e) => setTopPosterActive(e.target.checked)}
                  className="w-4 h-4 text-brand-primary rounded"
                />
                <label htmlFor="top_poster_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Display Top Poster on Homepage
                </label>
              </div>
            </div>

            {/* =================================================================
                CARD 2: BOTTOM SIDE POSTER
               ================================================================= */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">2. Bottom Side Poster (নিচের পোস্টার)</h2>
                  <p className="text-[11px] text-slate-400">Position: Right bottom corner beside hero slider</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 uppercase">
                  Bottom Position
                </span>
              </div>

              <div>
                <SingleImageUploader
                  value={bottomPosterImage}
                  onChange={setBottomPosterImage}
                  folder="banners"
                  label="Upload Bottom Poster Image (PC / Mobile)"
                  recommendedSize="800 x 450 px (Landscape / 16:9 ratio)"
                  maxWidth={1200}
                  maxHeight={700}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Click URL / Destination (ক্লিক করলে কোন পেজে যাবে)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /shop?category=monitors"
                  value={bottomPosterLink}
                  onChange={(e) => setBottomPosterLink(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="bottom_poster_active"
                  checked={bottomPosterActive}
                  onChange={(e) => setBottomPosterActive(e.target.checked)}
                  className="w-4 h-4 text-brand-primary rounded"
                />
                <label htmlFor="bottom_poster_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Display Bottom Poster on Homepage
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSide}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold shadow-md transition-all disabled:opacity-50"
            >
              {savingSide ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Side Posters...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Both Side Posters</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          HERO BANNER CREATE / EDIT MODAL
         ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-4 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Hero Banner' : 'Create Hero Banner'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHero} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banner Name / Campaign Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Smartphones Launch Banner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div>
                <SingleImageUploader
                  value={image}
                  onChange={setImage}
                  folder="banners"
                  label="Banner Graphic Artwork (Upload from PC / Mobile)"
                  recommendedSize="1400 x 600 px (Recommended)"
                  maxWidth={1400}
                  maxHeight={700}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Click URL / Destination
                </label>
                <input
                  type="text"
                  placeholder="e.g. /shop, /category/smartphones"
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="banner_active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-brand-primary rounded"
                />
                <label htmlFor="banner_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Display Banner in Hero Slider
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingId ? 'Update Banner' : 'Create Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
