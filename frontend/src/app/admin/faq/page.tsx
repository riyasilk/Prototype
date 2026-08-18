'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import '../admin.css';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
  createdAt: string;
}

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    order: 0,
    published: true,
  });

  const categories = ['General', 'Ordering & MOQ', 'Customization & Logo', 'Shipping & Delivery', 'Fabric & Quality'];

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/faqs');
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      } else {
        throw new Error('Failed to fetch FAQs.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading FAQs.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      order: faqs.length + 1,
      published: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      order: faq.order || 0,
      published: faq.published !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const endpoint = editingId ? `/api/v1/faqs/${editingId}` : '/api/v1/faqs';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          ...formData,
          order: Number(formData.order),
        }),
      });

      if (!res.ok) throw new Error('Failed to save FAQ.');

      setSuccessMsg(editingId ? 'FAQ updated!' : 'FAQ created!');
      setIsModalOpen(false);
      fetchFaqs();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error saving FAQ.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ entry?')) return;
    try {
      const res = await apiFetch(`/api/v1/faqs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete FAQ.');
      setSuccessMsg('FAQ deleted.');
      fetchFaqs();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error deleting FAQ.');
    }
  };

  const filteredFaqs = faqs.filter((f) => {
    if (selectedCategory !== 'All' && f.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="crm-container">
      <div className="crm-header">
        <div>
          <h1 className="crm-title">FAQ Manager CMS</h1>
          <p className="crm-subtitle">
            Manage customer help center questions, bulk order guidelines, and shipping details.
          </p>
        </div>
        <button className="new-inquiry-btn" onClick={handleOpenAddModal}>
          ❓ Add FAQ Question
        </button>
      </div>

      {successMsg && <div className="crm-success-banner">✅ {successMsg}</div>}
      {error && <div className="crm-error-banner">⚠️ {error}</div>}

      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <span className="login-spinner" style={{ width: '40px', height: '40px' }}></span>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="empty-state-card">
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>❓</div>
          <h3>No FAQs Found</h3>
          <p>Click "Add FAQ Question" to populate your customer support FAQ page.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              style={{
                background: '#0f172a',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '20px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span className="badge-pill badge-corporate">{faq.category || 'General'}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Order #{faq.order}</span>
                  {!faq.published && <span className="badge-pill status-contacted">Draft</span>}
                </div>
                <h3 style={{ fontSize: '1.05rem', color: '#f3f4f6', marginBottom: '8px' }}>{faq.question}</h3>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.5 }}>{faq.answer}</p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button className="action-btn" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }} onClick={() => handleEdit(faq)}>
                  ✏️ Edit
                </button>
                <button className="action-btn" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }} onClick={() => handleDelete(faq.id)}>
                  🗑️ Delete
                </button>
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
              <h2>{editingId ? 'Edit FAQ Entry' : 'Add FAQ Question'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Question *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What is the Minimum Order Quantity (MOQ) for custom logo embroidery?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Answer Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide a helpful, clear answer for customers."
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Display Sequence Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="faqPublished"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  />
                  <label htmlFor="faqPublished" style={{ color: '#fff', cursor: 'pointer' }}>
                    Publish on Website
                  </label>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '15px' }}>
                <button type="button" className="action-btn" style={{ background: '#334155' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="new-inquiry-btn">
                  {editingId ? 'Save Changes' : 'Create FAQ Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
