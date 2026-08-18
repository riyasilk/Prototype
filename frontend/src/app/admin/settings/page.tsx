'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import '../admin.css';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'contact' | 'stats' | 'social'>('general');

  const [settings, setSettings] = useState({
    companyName: 'Riya Silk',
    tagline: 'Leading Bulk Uniform Manufacturer & Supplier',
    heroTitle: 'Custom Uniform Solutions for Corporate, Healthcare & Industrial Enterprises',
    heroSubtitle: 'Direct-from-factory manufacturing, custom embroidery, high-grade fabrics, and guaranteed ON-TIME delivery.',
    heroCtaText: 'Request Wholesale Quote',
    heroCtaLink: '#contact-section',
    statsCapacity: '5,000+',
    statsTailors: '150+',
    statsSqFt: '100K+',
    statsClients: '500+',
    contactPhone: '+91 99999 99999',
    contactEmail: 'info@riyasilk.com',
    contactAddress: 'Surat Textile Market, Gujarat, India',
    officeHours: 'Monday to Saturday, 9:00 AM - 6:00 PM IST',
    catalogPdfUrl: '/riyasilk_catalogue.pdf',
    gstNumber: '24AAAAA0000A1Z5',
    msmeNumber: 'UDYAM-GJ-00-0000000',
    googleMapsEmbed: '',
    socialWhatsapp: '+91 99999 99999',
    socialInsta: 'https://instagram.com/riyasilk',
    socialFb: 'https://facebook.com/riyasilk',
    socialLinkedin: 'https://linkedin.com/company/riyasilk',
    socialYoutube: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/settings/homepage');
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading site settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/settings/homepage', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to save settings.');

      setSuccessMsg('Homepage & Site settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crm-container">
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Homepage & Site Settings</h1>
          <p className="crm-subtitle">
            Configure global website content, company registration details, hero section text, contact details, and social links.
          </p>
        </div>
        <button className="new-inquiry-btn" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>

      {successMsg && <div className="crm-success-banner">✅ {successMsg}</div>}
      {error && <div className="crm-error-banner">⚠️ {error}</div>}

      {/* Settings Navigation Tabs */}
      <div className="crm-toolbar">
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'general' ? '#a21caf' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none' }}
            onClick={() => setActiveTab('general')}
          >
            🏢 Company & General
          </button>
          <button
            className={`tab-btn ${activeTab === 'hero' ? 'active' : ''}`}
            style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'hero' ? '#a21caf' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none' }}
            onClick={() => setActiveTab('hero')}
          >
            🎯 Hero Banner
          </button>
          <button
            className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
            style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'contact' ? '#a21caf' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none' }}
            onClick={() => setActiveTab('contact')}
          >
            📞 Contact & Address
          </button>
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'stats' ? '#a21caf' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none' }}
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistics Counters
          </button>
          <button
            className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', background: activeTab === 'social' ? '#a21caf' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none' }}
            onClick={() => setActiveTab('social')}
          >
            🌐 Social & Media
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <span className="login-spinner" style={{ width: '40px', height: '40px' }}></span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#0f172a', padding: '30px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginTop: '20px' }}>
          {/* TAB 1: COMPANY & GENERAL */}
          {activeTab === 'general' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Company Brand Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Company Tagline</label>
                <input
                  type="text"
                  value={settings.tagline || ''}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>GST Number</label>
                <input
                  type="text"
                  placeholder="24AAAAA0000A1Z5"
                  value={settings.gstNumber || ''}
                  onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>MSME / Udyam Reg. Number</label>
                <input
                  type="text"
                  placeholder="UDYAM-GJ-00-0000000"
                  value={settings.msmeNumber || ''}
                  onChange={(e) => setSettings({ ...settings, msmeNumber: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Catalog Brochure PDF URL</label>
                <input
                  type="text"
                  value={settings.catalogPdfUrl}
                  onChange={(e) => setSettings({ ...settings, catalogPdfUrl: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: HERO BANNER */}
          {activeTab === 'hero' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Hero Main Headline Title</label>
                <input
                  type="text"
                  value={settings.heroTitle}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Hero Subtitle Copy</label>
                <textarea
                  rows={3}
                  value={settings.heroSubtitle}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>CTA Button Label</label>
                <input
                  type="text"
                  value={settings.heroCtaText}
                  onChange={(e) => setSettings({ ...settings, heroCtaText: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>CTA Button Target Link</label>
                <input
                  type="text"
                  value={settings.heroCtaLink}
                  onChange={(e) => setSettings({ ...settings, heroCtaLink: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & ADDRESS */}
          {activeTab === 'contact' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Business Phone / Hotline</label>
                <input
                  type="text"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Official Support Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Factory / Office Address</label>
                <input
                  type="text"
                  value={settings.contactAddress || ''}
                  onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Working Hours</label>
                <input
                  type="text"
                  value={settings.officeHours}
                  onChange={(e) => setSettings({ ...settings, officeHours: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
            </div>
          )}

          {/* TAB 4: STATS COUNTERS */}
          {activeTab === 'stats' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Monthly Production Capacity</label>
                <input
                  type="text"
                  value={settings.statsCapacity}
                  onChange={(e) => setSettings({ ...settings, statsCapacity: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Skilled Master Tailors Count</label>
                <input
                  type="text"
                  value={settings.statsTailors}
                  onChange={(e) => setSettings({ ...settings, statsTailors: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Manufacturing Facility Area (Sq Ft)</label>
                <input
                  type="text"
                  value={settings.statsSqFt}
                  onChange={(e) => setSettings({ ...settings, statsSqFt: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Satisfied B2B Enterprise Clients</label>
                <input
                  type="text"
                  value={settings.statsClients}
                  onChange={(e) => setSettings({ ...settings, statsClients: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
            </div>
          )}

          {/* TAB 5: SOCIAL LINKS */}
          {activeTab === 'social' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>WhatsApp Business Number</label>
                <input
                  type="text"
                  value={settings.socialWhatsapp || ''}
                  onChange={(e) => setSettings({ ...settings, socialWhatsapp: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Instagram Profile URL</label>
                <input
                  type="text"
                  value={settings.socialInsta || ''}
                  onChange={(e) => setSettings({ ...settings, socialInsta: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Facebook Page URL</label>
                <input
                  type="text"
                  value={settings.socialFb || ''}
                  onChange={(e) => setSettings({ ...settings, socialFb: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>LinkedIn Page URL</label>
                <input
                  type="text"
                  value={settings.socialLinkedin || ''}
                  onChange={(e) => setSettings({ ...settings, socialLinkedin: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="new-inquiry-btn" disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
