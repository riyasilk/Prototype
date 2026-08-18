'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import '../admin.css';

interface Testimonial {
  id: string;
  name: string;
  designation: string;
  company: string;
  category: string;
  rating: number;
  quote: string;
  clientLogo?: string;
  location?: string;
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    designation: 'Procurement Manager',
    company: '',
    category: 'Corporate',
    rating: 5,
    quote: '',
    clientLogo: '',
    location: 'Mumbai, India',
    isFeatured: true,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/testimonials');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        throw new Error('Failed to fetch testimonials.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading testimonials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      designation: 'Procurement Head',
      company: '',
      category: 'Corporate',
      rating: 5,
      quote: '',
      clientLogo: '',
      location: 'Mumbai, India',
      isFeatured: true,
    });
    setIsModalOpen(true);
  };

  const handleEditItem = (item: Testimonial) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      designation: item.designation,
      company: item.company,
      category: item.category,
      rating: item.rating || 5,
      quote: item.quote,
      clientLogo: item.clientLogo || '',
      location: item.location || 'India',
      isFeatured: item.isFeatured,
    });
    setIsModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFormData((prev) => ({ ...prev, clientLogo: data.url }));
    } catch (err: any) {
      alert(err.message || 'Error uploading logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const endpoint = editingId ? `/api/v1/testimonials/${editingId}` : '/api/v1/testimonials';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          ...formData,
          rating: Number(formData.rating),
        }),
      });

      if (!res.ok) throw new Error('Failed to save testimonial.');

      setSuccessMsg(editingId ? 'Testimonial updated!' : 'Testimonial created!');
      setIsModalOpen(false);
      fetchTestimonials();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error saving testimonial.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      const res = await apiFetch(`/api/v1/testimonials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete testimonial.');
      setSuccessMsg('Testimonial deleted successfully.');
      fetchTestimonials();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error deleting testimonial.');
    }
  };

  return (
    <div className="crm-container">
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Testimonials & Client Reviews CMS</h1>
          <p className="crm-subtitle">
            Manage customer reviews, star ratings, corporate designations, and client logo showcases.
          </p>
        </div>
        <button className="new-inquiry-btn" onClick={handleOpenAddModal}>
          ⭐ Add Testimonial
        </button>
      </div>

      {successMsg && <div className="crm-success-banner">✅ {successMsg}</div>}
      {error && <div className="crm-error-banner">⚠️ {error}</div>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <span className="login-spinner" style={{ width: '40px', height: '40px' }}></span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state-card">
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⭐</div>
          <h3>No Testimonials Found</h3>
          <p>Click "Add Testimonial" to display client feedback on your website.</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ marginTop: '20px' }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>Client / Company</th>
                <th>Industry Category</th>
                <th>Rating</th>
                <th>Quote Excerpt</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      {item.designation}, {item.company}
                    </div>
                  </td>
                  <td>
                    <span className="badge-pill badge-corporate">{item.category}</span>
                  </td>
                  <td>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                      {'★'.repeat(item.rating || 5)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      "{item.quote}"
                    </div>
                  </td>
                  <td>
                    {item.isFeatured ? (
                      <span className="badge-pill status-won">Featured</span>
                    ) : (
                      <span className="badge-pill status-contacted">Standard</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }} onClick={() => handleEditItem(item)}>
                        ✏️ Edit
                      </button>
                      <button className="action-btn" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }} onClick={() => handleDelete(item.id)}>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Testimonial' : 'Add Client Review'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Motors"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Head of Procurement"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Industry Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Healthcare, Corporate"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Star Rating (1 - 5) *</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                >
                  <option value={5}>★★★★★ (5 Stars)</option>
                  <option value={4}>★★★★☆ (4 Stars)</option>
                  <option value={3}>★★★☆☆ (3 Stars)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Quote Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Outstanding stitching quality and prompt bulk delivery for our 1,200 staff uniforms."
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="testiFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                />
                <label htmlFor="testiFeatured" style={{ color: '#fff', cursor: 'pointer' }}>
                  Showcase on Homepage Testimonials Slider
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: '15px' }}>
                <button type="button" className="action-btn" style={{ background: '#334155' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="new-inquiry-btn">
                  {editingId ? 'Save Changes' : 'Create Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
