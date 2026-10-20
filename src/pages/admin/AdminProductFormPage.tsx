import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Cpu,
  Layers,
  HelpCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { getProductById, saveProduct, deleteProduct } from '../../services/productService';
import { getAllCategoriesAdmin } from '../../services/categoryService';
import { logAdminAction } from '../../services/auditService';
import { useAuth } from '../../lib/authContext';
import { Product, ProductSpecification, ProductOption, ProductVariant } from '../../types/product';
import { Category } from '../../types/category';
import { slugify } from '../../lib/utils';

const SUGGESTED_SPEC_KEYS = [
  'Battery Capacity',
  'Display Size & Type',
  'Processor / Chipset',
  'RAM / Memory',
  'Internal Storage',
  'Bluetooth Version',
  'Charging Speed / Port',
  'Water Resistance Rating',
  'Weight / Dimensions',
  'Compatibility / OS',
  'Microphone / Audio Codec',
  'Sensors',
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'smartwatches', name: 'Smartwatches', slug: 'smartwatches', active: true, sortOrder: 1 },
  { id: 'earbuds', name: 'Earbuds & TWS', slug: 'earbuds', active: true, sortOrder: 2 },
  { id: 'headphones', name: 'Headphones', slug: 'headphones', active: true, sortOrder: 3 },
  { id: 'speakers', name: 'Bluetooth Speakers', slug: 'speakers', active: true, sortOrder: 4 },
  { id: 'powerbanks', name: 'Power Banks & Chargers', slug: 'powerbanks', active: true, sortOrder: 5 },
  { id: 'accessories', name: 'Smart Accessories', slug: 'accessories', active: true, sortOrder: 6 },
];

/**
 * Auto-generates a clean, readable SKU from the product title
 * e.g. "Haylou Solar Plus RT3" -> "UZ-HAYLO-SOLAR-PLUS"
 */
export const generateSkuFromTitle = (title: string): string => {
  if (!title || !title.trim()) return '';
  const clean = slugify(title).toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const parts = clean
    .split('-')
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => (w.length <= 5 ? w : w.slice(0, 5)));
  if (parts.length === 0) return '';
  return `UZ-${parts.join('-')}`.slice(0, 22);
};

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [isSkuCustomized, setIsSkuCustomized] = useState(false);
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [category, setCategory] = useState('');

  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(10);
  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState('');
  const [warrantyDuration, setWarrantyDuration] = useState('1 Year Official Warranty');
  const [warrantyDetails, setWarrantyDetails] = useState('');
  const [includedItems, setIncludedItems] = useState<string[]>(['Device', 'Charging Cable', 'User Manual']);
  const [includedItemInput, setIncludedItemInput] = useState('');

  // Technical Specifications (Key/Value pairs)
  const [specs, setSpecs] = useState<ProductSpecification[]>([
    { key: 'Battery Capacity', value: '' },
    { key: 'Connectivity', value: '' },
  ]);

  // Variants & Options
  const [hasVariants, setHasVariants] = useState(false);
  const [options, setOptions] = useState<ProductOption[]>([
    { name: 'Color', values: ['Black'] },
  ]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Badges & Flags
  const [featured, setFeatured] = useState(false);
  const [newArrival, setNewArrival] = useState(true);
  const [bestSeller, setBestSeller] = useState(false);
  const [active, setActive] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  useEffect(() => {
    getAllCategoriesAdmin()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(cats);
          if (!isEditing) {
            setCategory((prev) => prev || cats[0].slug || cats[0].id);
          }
        } else {
          setCategories(DEFAULT_CATEGORIES);
          if (!isEditing) {
            setCategory((prev) => prev || DEFAULT_CATEGORIES[0].slug);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load categories, using defaults:', err);
        setCategories(DEFAULT_CATEGORIES);
        if (!isEditing) {
          setCategory((prev) => prev || DEFAULT_CATEGORIES[0].slug);
        }
      });

    if (isEditing && id) {
      setLoading(true);
      getProductById(id).then((p) => {
        if (p) {
          setName(p.name);
          setSlug(p.slug || slugify(p.name));
          setSku(p.sku || generateSkuFromTitle(p.name));
          setIsSlugCustomized(Boolean(p.slug));
          setIsSkuCustomized(Boolean(p.sku));
          setBrand(p.brand);
          setModelNumber(p.modelNumber || '');
          setCategory(p.category);
          setSubcategory(p.subcategory || '');
          setDescription(p.description);
          setShortDescription(p.shortDescription || '');
          setPrice(p.price);
          setSalePrice(p.salePrice || '');
          setCostPrice(p.costPrice || '');
          setStock(p.stock);
          setImages(p.images || []);
          setThumbnail(p.thumbnail || '');
          setWarrantyDuration(p.warrantyDuration || '');
          setWarrantyDetails(p.warrantyDetails || '');
          setIncludedItems(p.includedItems || []);
          setSpecs(p.technicalSpecifications || []);
          setHasVariants(p.hasVariants || false);
          setOptions(p.options || []);
          setVariants(p.variants || []);
          setFeatured(p.featured);
          setNewArrival(p.newArrival);
          setBestSeller(p.bestSeller);
          setActive(p.active);
          setSeoTitle(p.seoTitle || '');
          setSeoDescription(p.seoDescription || '');
        }
        setLoading(false);
      });
    }
  }, [id, isEditing]);


  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugCustomized) {
      setSlug(slugify(val));
    }
    if (!isSkuCustomized) {
      setSku(generateSkuFromTitle(val));
    }
  };

  // Spec handlers
  const handleAddSpec = (suggestedKey?: string) => {
    setSpecs([...specs, { key: suggestedKey || '', value: '' }]);
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: 'key' | 'value', text: string) => {
    const updated = [...specs];
    updated[idx][field] = text;
    setSpecs(updated);
  };

  // Included items handlers
  const handleAddIncludedItem = () => {
    if (includedItemInput.trim()) {
      setIncludedItems([...includedItems, includedItemInput.trim()]);
      setIncludedItemInput('');
    }
  };

  const handleRemoveIncludedItem = (idx: number) => {
    setIncludedItems(includedItems.filter((_, i) => i !== idx));
  };

  // Generate / add a variant
  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: `v_${Date.now()}`,
      sku: `${sku || 'SKU'}-${variants.length + 1}`,
      options: {},
      price: Number(price) || 0,
      stock: 5,
    };
    options.forEach((opt) => {
      newVariant.options[opt.name] = opt.values[0] || '';
    });
    setVariants([...variants, newVariant]);
  };

  const handleRemoveVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx: number, field: string, val: any) => {
    const updated = [...variants];
    (updated[idx] as any)[field] = val;
    setVariants(updated);
  };

  const handleVariantOptionChange = (idx: number, optName: string, optVal: string) => {
    const updated = [...variants];
    updated[idx].options[optName] = optVal;
    setVariants(updated);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Product title (প্রোডাক্ট টাইটেল) দেওয়া আবশ্যক।');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMsg('Product price (মূল্য) ০ এর বেশি হতে হবে।');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalCategory = category || categories[0]?.slug || 'smartwatches';
    const generatedSlug = slug.trim() || slugify(name);
    const generatedSku = sku.trim()
      ? sku.trim().toUpperCase()
      : generateSkuFromTitle(name) || `UZ-${generatedSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;

    setSaving(true);

    try {
      const selectedCatObj = categories.find((c) => c.slug === finalCategory || c.id === finalCategory);

      // Clean specifications
      const cleanSpecs = specs
        .filter((s) => s.key && s.key.trim() && s.value && s.value.trim())
        .map((s) => ({ key: s.key.trim(), value: s.value.trim() }));

      const payload: Partial<Product> = {
        name: name.trim(),
        slug: generatedSlug,
        sku: generatedSku,
        brand: brand.trim() || 'Uniqzen',
        modelNumber: modelNumber.trim(),
        category: finalCategory,
        categoryName: selectedCatObj?.name || finalCategory,
        subcategory: subcategory.trim() || '',
        description: description || '',
        shortDescription: shortDescription || '',
        price: Number(price),
        stock: Number(stock) || 0,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80'],
        thumbnail: thumbnail || images[0] || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
        warrantyDuration: warrantyDuration || '1 Year Official Warranty',
        warrantyDetails: warrantyDetails || '',
        includedItems: includedItems || [],
        technicalSpecifications: cleanSpecs,
        hasVariants: Boolean(hasVariants),
        options: hasVariants ? options : [],
        variants: hasVariants ? variants : [],
        featured: Boolean(featured),
        newArrival: Boolean(newArrival),
        bestSeller: Boolean(bestSeller),
        active: Boolean(active),
        seoTitle: seoTitle.trim() || name.trim(),
        seoDescription: seoDescription.trim() || shortDescription.trim(),
      };

      if (salePrice && Number(salePrice) > 0) {
        payload.salePrice = Number(salePrice);
      }
      if (costPrice && Number(costPrice) > 0) {
        payload.costPrice = Number(costPrice);
      }

      const savedId = await saveProduct(payload, isEditing ? id : undefined);
      setSaveSuccess(true);

      if (currentUser) {
        logAdminAction(
          currentUser.uid,
          isEditing ? 'product.edit' : 'product.create',
          'product',
          savedId,
          { name },
          currentUser.email || ''
        );
      }

      setTimeout(() => {
        navigate('/admin/products');
      }, 500);
    } catch (err: any) {
      console.error('Save product error:', err);
      setErrorMsg(err.message || 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!id || !isEditing) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteProduct(id, false);
      if (currentUser) {
        logAdminAction(currentUser.uid, 'product.delete', 'product', id, { name }, currentUser.email || '');
      }
      navigate('/admin/products');
    } catch (err: any) {
      console.error('Delete product error:', err);
      setErrorMsg(err.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };


  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-primary" />
        <span>Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <SEO title={`${isEditing ? 'Edit' : 'Add'} Product — Admin Portal`} />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/products"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {isEditing ? `Edit: ${name}` : 'Create New Gadget'}
            </h1>
            <p className="text-xs text-slate-500">
              Enter hardware specifications, pricing, imagery, and variant configurations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={saving || deleting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-rose-600" />}
              <span>{deleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Product'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm">
          ⚠️ {errorMsg}
        </div>
      )}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Product saved successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-5">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Haylou Solar Plus RT3 AMOLED Smartwatch"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>SKU (Stock Keeping Unit)</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Auto-fill
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. UZ-HAYLO-SOLAR-PLUS"
                value={sku}
                onChange={(e) => {
                  const val = e.target.value;
                  setSku(val);
                  if (val.trim()) {
                    setIsSkuCustomized(true);
                  } else {
                    setIsSkuCustomized(false);
                    setSku(generateSkuFromTitle(name));
                  }
                }}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 uppercase tracking-wider font-mono outline-none bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>URL Slug</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Auto-fill
                </span>
              </label>
              <input
                type="text"
                value={slug}
                placeholder="e.g. haylou-solar-plus-rt3"
                onChange={(e) => {
                  const val = e.target.value;
                  setSlug(val);
                  if (val.trim()) {
                    setIsSlugCustomized(true);
                  } else {
                    setIsSlugCustomized(false);
                    setSlug(slugify(name));
                  }
                }}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-600 outline-none bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary"
              />
            </div>


            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                placeholder="e.g. Apple, Samsung, Anker, Haylou, Xiaomi"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Number
              </label>
              <input
                type="text"
                placeholder="e.g. A2848, RT3, B2568"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white outline-none cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug || c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subcategory / Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Bluetooth Calling, Fast Charger, ANC"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Summary Description
            </label>
            <input
              type="text"
              placeholder="e.g. 1.43-inch AMOLED display with Bluetooth calling and 105 sport modes."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Product Description
            </label>
            <textarea
              rows={5}
              placeholder="Describe gadget features, battery life, design build, sound profile..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
            />
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-5">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Pricing & Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Regular Price (BDT ৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="4500"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sale / Offer Price (BDT ৳)
              </label>
              <input
                type="number"
                min={0}
                placeholder="3990"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none text-brand-secondary font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost Price (Admin Only ৳)
              </label>
              <input
                type="number"
                min={0}
                placeholder="3200"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Stock Units <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="25"
                value={stock}
                onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Product Photography */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Product Photography</h2>
            <p className="text-xs text-slate-400">
              Upload high-resolution photography. Star icon designates the primary cover image.
            </p>
          </div>

          <ImageUploader
            images={images}
            onChange={setImages}
            thumbnail={thumbnail}
            onThumbnailChange={setThumbnail}
            folder="gadgets"
            maxFiles={6}
          />
        </div>

        {/* Section 4: Gadget Specifications (Flexible Key/Value) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-secondary" />
                <span>Technical Specifications</span>
              </h2>
              <p className="text-xs text-slate-400">
                Category-specific specs (Battery, Display, Processor, Bluetooth, etc.)
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddSpec()}
              className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Spec</span>
            </button>
          </div>

          {/* Quick Suggestion Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] self-center mr-1">Quick Add:</span>
            {SUGGESTED_SPEC_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleAddSpec(key)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
              >
                + {key}
              </button>
            ))}
          </div>

          {/* Specs List */}
          <div className="space-y-2.5">
            {specs.map((spec, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Feature Name (e.g. Battery)"
                  value={spec.key}
                  onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                  className="w-1/3 text-xs px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
                <input
                  type="text"
                  placeholder="Specification Value (e.g. 5000 mAh, 67W Turbo Charge)"
                  value={spec.value}
                  onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Variants & Configurations */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-secondary" />
                <span>Product Variants & Configurations</span>
              </h2>
              <p className="text-xs text-slate-400">
                For devices with multiple colors, storage sizes, or RAM configurations.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                className="w-4 h-4 text-brand-primary rounded"
              />
              <span>Enable Variants</span>
            </label>
          </div>

          {hasVariants && (
            <div className="space-y-6 pt-2">
              {/* Option definitions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Option Attributes (e.g. Color, Storage)
                </h4>
                {options.map((opt, optIdx) => (
                  <div key={optIdx} className="p-3 bg-slate-50 rounded-xl space-y-2 border">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Option Name (e.g. Color or Storage)"
                        value={opt.name}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[optIdx].name = e.target.value;
                          setOptions(updated);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Comma-separated values (e.g. Black, Silver, Blue)"
                        value={opt.values.join(', ')}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[optIdx].values = e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setOptions(updated);
                        }}
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Variants table */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Variant Inventory Matrix
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant Combination</span>
                  </button>
                </div>

                {variants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs divide-y divide-slate-200">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-2 px-3">Configuration</th>
                          <th className="py-2 px-3">SKU</th>
                          <th className="py-2 px-3">Price (৳)</th>
                          <th className="py-2 px-3">Stock</th>
                          <th className="py-2 px-3 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {variants.map((v, vIdx) => (
                          <tr key={v.id}>
                            <td className="py-2 px-3 font-semibold">
                              {options.map((opt) => (
                                <select
                                  key={opt.name}
                                  value={v.options[opt.name] || ''}
                                  onChange={(e) =>
                                    handleVariantOptionChange(vIdx, opt.name, e.target.value)
                                  }
                                  className="mr-2 px-2 py-1 border rounded text-xs"
                                >
                                  {opt.values.map((val) => (
                                    <option key={val} value={val}>
                                      {val}
                                    </option>
                                  ))}
                                </select>
                              ))}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => handleVariantChange(vIdx, 'sku', e.target.value)}
                                className="px-2 py-1 border rounded w-28 text-xs font-mono"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) =>
                                  handleVariantChange(vIdx, 'price', Number(e.target.value))
                                }
                                className="px-2 py-1 border rounded w-24 text-xs font-bold"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={v.stock}
                                onChange={(e) =>
                                  handleVariantChange(vIdx, 'stock', Number(e.target.value))
                                }
                                className="px-2 py-1 border rounded w-20 text-xs font-bold"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(vIdx)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No variant combinations added yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 6: Warranty & Box Contents */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-5">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Warranty & In The Box
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Warranty Duration
              </label>
              <input
                type="text"
                placeholder="e.g. 1 Year Official Brand Warranty"
                value={warrantyDuration}
                onChange={(e) => setWarrantyDuration(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Warranty Terms & Policy
              </label>
              <input
                type="text"
                placeholder="e.g. Covers manufacturing defects. Physical damage excluded."
                value={warrantyDetails}
                onChange={(e) => setWarrantyDetails(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              What's In The Box (Included Accessories)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. Type-C Braided Cable"
                value={includedItemInput}
                onChange={(e) => setIncludedItemInput(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-300"
              />
              <button
                type="button"
                onClick={handleAddIncludedItem}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {includedItems.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIncludedItem(idx)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 7: Flags & Status */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Visibility & Badges
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
            <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 text-brand-primary rounded"
              />
              <span>Live in Store (Active)</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-brand-primary rounded"
              />
              <span>Featured Gadget</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={newArrival}
                onChange={(e) => setNewArrival(e.target.checked)}
                className="w-4 h-4 text-brand-primary rounded"
              />
              <span>New Arrival</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={bestSeller}
                onChange={(e) => setBestSeller(e.target.checked)}
                className="w-4 h-4 text-brand-primary rounded"
              />
              <span>Best Seller</span>
            </label>
          </div>
        </div>



        {/* Bottom Alerts & Actions */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm font-medium">
            ⚠️ {errorMsg}
          </div>
        )}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Product saved successfully! Redirecting...</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={saving || deleting}
                className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-rose-600" />}
                <span>{deleting ? 'Deleting...' : 'Delete Product'}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/products"
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || deleting}
              className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save & Publish Product'}</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
