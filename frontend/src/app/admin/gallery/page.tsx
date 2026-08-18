'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import '../admin.css';

interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  industry?: string;
  description?: string;
  altText?: string;
  isFeatured: boolean;
  order: number;
  createdAt: string;
}

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('Show All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Corporate',
    industry: 'Corporate',
    description: '',
    imageUrl: '',
    altText: '',
    isFeatured: false,
    order: 0,
  });

  const categories = [
    'Corporate',
    'Healthcare',
    'Hospitality',
    'Industrial',
    'Education',
    'Security',
    'Others',
  ];

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/gallery');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        throw new Error('Failed to fetch gallery showcase items.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading gallery data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'Corporate',
      industry: 'Corporate',
      description: '',
      imageUrl: '',
      altText: '',
      isFeatured: false,
      order: 0,
    });
    setIsModalOpen(true);
  };

  const handleEditItem = (item: GalleryItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      category: item.category,
      industry: item.industry || item.category,
      description: item.description || '',
      imageUrl: item.imageUrl,
      altText: item.altText || '',
      isFeatured: item.isFeatured,
      order: item.order || 0,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const res = await apiFetch('/api/v1/upload/file', {
        method: 'POST',
        body: uploadForm,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err: any) {
      alert(err.message || 'Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const endpoint = editingId ? `/api/v1/gallery/${editingId}` : '/api/v1/gallery';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          ...formData,
          order: Number(formData.order),
        }),
      });

      if (!res.ok) throw new Error('Failed to save gallery item.');

      setSuccessMsg(editingId ? 'Gallery item updated!' : 'Photo added to gallery!');
      setIsModalOpen(false);
      fetchGallery();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error saving gallery item.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gallery item?')) return;
    try {
      const res = await apiFetch(`/api/v1/gallery/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item.');
      setSuccessMsg('Item deleted successfully.');
      fetchGallery();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error deleting gallery item.');
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'Show All' && item.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="crm-container">
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Gallery Showcase CMS</h1>
          <p className="crm-subtitle">
            Upload and organize client showcase photos across corporate, healthcare, hospitality, and industrial lines.
          </p>
        </div>
        <button className="new-inquiry-btn" onClick={handleOpenAddModal}>
          📸 Upload Photo
        </button>
      </div>

      {successMsg && <div className="crm-success-banner">✅ {successMsg}</div>}
      {error && <div className="crm-error-banner">⚠️ {error}</div>}

      {/* Filter Tabs */}
      <div className="crm-toolbar">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`badge-pill ${selectedCategory === 'Show All' ? 'status-won' : ''}`}
            style={{ cursor: 'pointer', border: 'none', padding: '8px 16px' }}
            onClick={() => setSelectedCategory('Show All')}
          >
            Show All ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`badge-pill ${selectedCategory === cat ? 'status-won' : ''}`}
              style={{ cursor: 'pointer', border: 'none', padding: '8px 16px', background: selectedCategory === cat ? '#a21caf' : 'rgba(255,255,255,0.05)', color: '#fff' }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <span className="login-spinner" style={{ width: '40px', height: '40px' }}></span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state-card">
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🖼️</div>
          <h3>No Showcase Images</h3>
          <p>Click "Upload Photo" to add showcase images to your website gallery.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {filteredItems.map((item) => (
            <div key={item.id} style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '180px', position: 'relative', background: '#1e293b' }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span className="badge-pill badge-corporate" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                  {item.category}
                </span>
                {item.isFeatured && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#f59e0b', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    ★ Featured
                  </span>
                )}
              </div>
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>{item.title}</h3>
                  {item.description && <p style={{ fontSize: '0.85rem', color: '#9ca3af', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '15px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button className="action-btn" style={{ flex: 1, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }} onClick={() => handleEditItem(item)}>
                    ✏️ Edit
                  </button>
                  <button className="action-btn" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }} onClick={() => handleDelete(item.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Showcase Photo' : 'Upload Gallery Photo'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Image Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Hospital Nurse Uniform Line"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Industry Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Image File / URL *</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    required
                    placeholder="https://... or choose file"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    style={{ flex: 1, padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                  />
                  <input type="file" accept="image/*" id="gallery-file" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <label htmlFor="gallery-file" className="new-inquiry-btn" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {uploading ? 'Uploading...' : '📁 Upload'}
                  </label>
                </div>
              </div>

              {formData.imageUrl && (
                <div style={{ height: '120px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                  <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="galleryFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                />
                <label htmlFor="galleryFeatured" style={{ color: '#fff', cursor: 'pointer' }}>
                  Highlight as Featured Showcase Item
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: '15px' }}>
                <button type="button" className="action-btn" style={{ background: '#334155' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="new-inquiry-btn">
                  {editingId ? 'Save Changes' : 'Upload Showcase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
