'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import '../admin.css';

interface Category {
  id: string;
  name: string;
  subcategories?: Array<{ id: string; name: string }>;
}

interface ProductImage {
  id?: string;
  url: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  category: { id: string; name: string };
  subcategoryId?: string | null;
  subcategory?: { id: string; name: string } | null;
  moq: number;
  availableSizes: string[];
  availableColors: string[];
  fabricComposition: string;
  features: string[];
  specifications?: any;
  isFeatured: boolean;
  displayOrder: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  images: ProductImage[];
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; categoryId: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal & Tab States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'specs' | 'images' | 'seo' | 'preview'>('general');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newSubcatName, setNewSubcatName] = useState('');
  const [newSubcatParentId, setNewSubcatParentId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    moq: 50,
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    availableColors: ['Navy Blue', 'White', 'Black'],
    fabricComposition: '100% Cotton',
    features: ['Easy Care', 'Breathable', 'Durable Stitching'],
    isFeatured: false,
    displayOrder: 0,
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    images: ['/uploads/sample-product.jpg'],
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, subRes] = await Promise.all([
        apiFetch('/api/v1/products'),
        apiFetch('/api/v1/products/categories'),
        apiFetch('/api/v1/products/subcategories'),
      ]);

      if (prodRes.ok) {
        const prods = await prodRes.json();
        setProducts(prods);
      }
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats);
        if (cats.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: cats[0].id }));
        }
      }
      if (subRes.ok) {
        const subs = await subRes.json();
        setSubcategories(subs);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load products and categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      shortDescription: '',
      description: '',
      categoryId: categories[0]?.id || '',
      subcategoryId: '',
      moq: 50,
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      availableColors: ['Navy Blue', 'White', 'Black'],
      fabricComposition: '100% Cotton Blend',
      features: ['Easy Iron', 'Wrinkle Resistant'],
      isFeatured: false,
      displayOrder: 0,
      status: 'PUBLISHED',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      images: [],
    });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingId(prod.id);
    setFormData({
      title: prod.title,
      slug: prod.slug,
      shortDescription: prod.shortDescription,
      description: prod.description,
      categoryId: prod.categoryId,
      subcategoryId: prod.subcategoryId || '',
      moq: prod.moq,
      availableSizes: prod.availableSizes || ['S', 'M', 'L', 'XL'],
      availableColors: prod.availableColors || ['White', 'Navy'],
      fabricComposition: prod.fabricComposition,
      features: prod.features || [],
      isFeatured: prod.isFeatured,
      displayOrder: prod.displayOrder || 0,
      status: prod.status || 'PUBLISHED',
      seoTitle: prod.seoTitle || '',
      seoDescription: prod.seoDescription || '',
      seoKeywords: prod.seoKeywords || '',
      images: prod.images.map((img) => img.url),
    });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug === '' || !editingId ? slug : prev.slug,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadForm = new FormData();
      for (let i = 0; i < files.length; i++) {
        uploadForm.append('files', files[i]);
      }

      const res = await apiFetch('/api/v1/upload/files', {
        method: 'POST',
        body: uploadForm,
      });

      if (!res.ok) throw new Error('Failed to upload image.');
      const data = await res.json();
      const newUrls = data.files.map((f: any) => f.url);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newUrls],
      }));
    } catch (err: any) {
      alert(err.message || 'Error uploading files');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const endpoint = editingId ? `/api/v1/products/${editingId}` : '/api/v1/products';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        moq: Number(formData.moq),
        displayOrder: Number(formData.displayOrder),
        subcategoryId: formData.subcategoryId || undefined,
      };

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to save product.');
      }

      setSuccessMsg(editingId ? 'Product updated successfully!' : 'Product created successfully!');
      setIsModalOpen(false);
      fetchInitialData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while saving product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await apiFetch(`/api/v1/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product.');
      setSuccessMsg('Product deleted successfully.');
      fetchInitialData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error deleting product.');
    }
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await apiFetch('/api/v1/products/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create category.');
      setNewCatName('');
      setIsCatModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      alert(err.message || 'Error creating category');
    }
  };

  const handleAddSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcatName.trim() || !newSubcatParentId) return;
    try {
      const res = await apiFetch('/api/v1/products/subcategories', {
        method: 'POST',
        body: JSON.stringify({ categoryId: newSubcatParentId, name: newSubcatName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create subcategory.');
      setNewSubcatName('');
      setIsCatModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      alert(err.message || 'Error creating subcategory');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (selectedSubcategory && p.subcategoryId !== selectedSubcategory) return false;
    if (selectedStatus && p.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.fabricComposition.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableSubcatsForSelectedCat = subcategories.filter((s) => s.categoryId === selectedCategory);
  const availableSubcatsForForm = subcategories.filter((s) => s.categoryId === formData.categoryId);

  return (
    <div className="crm-container">
      {/* Header Banner */}
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Product Catalog CMS</h1>
          <p className="crm-subtitle">
            Manage uniform lines, categories, subcategories, fabrics, MOQ specs, and SEO metadata.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="new-inquiry-btn" style={{ background: '#475569' }} onClick={() => setIsCatModalOpen(true)}>
            📂 Categories & Subcategories
          </button>
          <button className="new-inquiry-btn" onClick={handleOpenAddModal}>
            ✨ Add New Product
          </button>
        </div>
      </div>

      {successMsg && <div className="crm-success-banner">✅ {successMsg}</div>}
      {error && <div className="crm-error-banner">⚠️ {error}</div>}

      {/* Filter Toolbar */}
      <div className="crm-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products by title, fabric, composition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory('');
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {selectedCategory && (
            <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)}>
              <option value="">All Subcategories</option>
              {availableSubcatsForSelectedCat.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          )}

          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <span className="login-spinner" style={{ width: '40px', height: '40px' }}></span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state-card">
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏷️</div>
          <h3>No Products Found</h3>
          <p>Get started by adding your first product line or adjusting your search filters.</p>
          <button className="new-inquiry-btn" style={{ marginTop: '15px' }} onClick={handleOpenAddModal}>
            Add First Product
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category / Subcategory</th>
                <th>MOQ</th>
                <th>Fabric</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#1e293b',
                          flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {p.images && p.images[0] ? (
                          <img
                            src={p.images[0].url}
                            alt={p.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                            👔
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Slug: /{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-pill badge-corporate">{p.category?.name || 'General'}</span>
                    {p.subcategory && (
                      <span className="badge-pill" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', marginLeft: '6px' }}>
                        {p.subcategory.name}
                      </span>
                    )}
                  </td>
                  <td>
                    <strong>{p.moq}</strong> pcs
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{p.fabricComposition}</span>
                  </td>
                  <td>
                    <span
                      className={`badge-pill ${
                        p.status === 'PUBLISHED'
                          ? 'status-won'
                          : p.status === 'DRAFT'
                          ? 'status-contacted'
                          : 'status-lost'
                      }`}
                    >
                      {p.status || 'PUBLISHED'}
                    </span>
                  </td>
                  <td>
                    {p.isFeatured ? (
                      <span style={{ color: '#f59e0b', fontSize: '1.2rem' }} title="Featured Product">
                        ★
                      </span>
                    ) : (
                      <span style={{ color: '#475569' }}>☆</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="action-btn"
                        style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}
                        onClick={() => handleEditProduct(p)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="action-btn"
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}
                        onClick={() => handleDeleteProduct(p.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabbed Product Editor Drawer Modal */}
      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Product' : 'Add New Product Line'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '20px' }}>
              <button
                className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'general' ? '#a21caf' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => setActiveTab('general')}
              >
                1. General
              </button>
              <button
                className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
                style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'specs' ? '#a21caf' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => setActiveTab('specs')}
              >
                2. Specs & Fabric
              </button>
              <button
                className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
                style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'images' ? '#a21caf' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => setActiveTab('images')}
              >
                3. Media ({formData.images.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
                style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'seo' ? '#a21caf' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => setActiveTab('seo')}
              >
                4. SEO Metadata
              </button>
              <button
                className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'preview' ? '#a21caf' : 'transparent', color: '#fff', border: 'none' }}
                onClick={() => setActiveTab('preview')}
              >
                5. Live Card Preview
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* TAB 1: GENERAL */}
              {activeTab === 'general' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Executive Slim Fit Shirt"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>URL Slug *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Subcategory</label>
                    <select
                      value={formData.subcategoryId}
                      onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    >
                      <option value="">None / General</option>
                      {availableSubcatsForForm.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Short Summary (Card Preview) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Premium cotton blend executive wear shirt designed for all-day comfort."
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Full Technical Description *</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: SPECS & FABRIC */}
              {activeTab === 'specs' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Minimum Order Quantity (MOQ) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.moq}
                      onChange={(e) => setFormData({ ...formData, moq: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Fabric Composition *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 60% Cotton, 40% Polyester"
                      value={formData.fabricComposition}
                      onChange={(e) => setFormData({ ...formData, fabricComposition: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Available Sizes (comma separated)</label>
                    <input
                      type="text"
                      value={formData.availableSizes.join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          availableSizes: e.target.value.split(',').map((s) => s.trim()),
                        })
                      }
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Available Colors (comma separated)</label>
                    <input
                      type="text"
                      value={formData.availableColors.join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          availableColors: e.target.value.split(',').map((c) => c.trim()),
                        })
                      }
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Key Features (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Easy Care, Breathable, Industrial Washable"
                      value={formData.features.join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: e.target.value.split(',').map((f) => f.trim()),
                        })
                      }
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                    <label htmlFor="isFeatured" style={{ color: '#f3f4f6', cursor: 'pointer' }}>
                      Mark as Featured Product on Homepage
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 3: MEDIA UPLOADS */}
              {activeTab === 'images' && (
                <div>
                  <div style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '8px', padding: '30px', textAlign: 'center', marginBottom: '20px', backgroundColor: '#0f172a' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</div>
                    <p style={{ color: '#9ca3af', marginBottom: '12px' }}>Upload product photos (JPG, PNG, WebP up to 10MB)</p>
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload" />
                    <label htmlFor="file-upload" className="new-inquiry-btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
                      {uploadingImage ? 'Uploading...' : 'Choose Files to Upload'}
                    </label>
                  </div>

                  <h4>Product Gallery ({formData.images.length})</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '10px' }}>
                    {formData.images.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', height: '100px', background: '#0f172a' }}>
                        <img src={url} alt={`Upload ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(239, 68, 68, 0.8)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SEO METADATA */}
              {activeTab === 'seo' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Meta Title Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Premium Executive Uniform Shirts | Riya Silk Uniforms"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Meta Description</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Order custom corporate uniform shirts in bulk directly from Riya Silk manufacturer."
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Keywords (comma separated)</label>
                    <input
                      type="text"
                      placeholder="corporate uniforms, office shirts, bulk uniform supplier"
                      value={formData.seoKeywords}
                      onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                      style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: LIVE CARD PREVIEW */}
              {activeTab === 'preview' && (
                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden', background: '#1e293b', flexShrink: 0 }}>
                      {formData.images[0] ? (
                        <img src={formData.images[0]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No Image</div>
                      )}
                    </div>
                    <div>
                      <span className="badge-pill badge-corporate">{categories.find((c) => c.id === formData.categoryId)?.name || 'Category'}</span>
                      <h3 style={{ color: '#fff', marginTop: '8px', marginBottom: '6px' }}>{formData.title || 'Product Title'}</h3>
                      <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '12px' }}>{formData.shortDescription || 'Short description preview...'}</p>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px' }}>
                        <strong>MOQ:</strong> {formData.moq} pcs | <strong>Fabric:</strong> {formData.fabricComposition}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {formData.availableSizes.map((s, i) => (
                          <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '25px' }}>
                <button type="button" className="action-btn" style={{ background: '#334155' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="new-inquiry-btn">
                  {editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories & Subcategories Management Modal */}
      {isCatModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsCatModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Category & Subcategory Hierarchy</h2>
              <button className="modal-close" onClick={() => setIsCatModalOpen(false)}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h4>Add New Industry Category</h4>
              <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <input
                  type="text"
                  required
                  placeholder="Category Name (e.g. Corporate, Healthcare)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
                <button type="submit" className="new-inquiry-btn">
                  Add Category
                </button>
              </form>
            </div>

            <div>
              <h4>Add Subcategory</h4>
              <form onSubmit={handleAddSubcategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <select
                  required
                  value={newSubcatParentId}
                  onChange={(e) => setNewSubcatParentId(e.target.value)}
                  style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                >
                  <option value="">Select Parent Category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Subcategory Name (e.g. Receptionist Uniforms, Doctor Coats)"
                    value={newSubcatName}
                    onChange={(e) => setNewSubcatName(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                  />
                  <button type="submit" className="new-inquiry-btn">
                    Add Subcategory
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
