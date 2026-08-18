'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import Link from 'next/link';

interface AnalyticsData {
  totalInquiries: number;
  wonLeads: number;
  lostLeads: number;
  activeLeads: number;
  conversionRate: number;
  industryStats: Array<{ industry: string; count: number }>;
  statusStats: Array<{ status: string; count: number }>;
  recentInquiries: Array<{
    id: string;
    company: string;
    contactName: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
    industry: string | null;
  }>;
}

interface InquiryItem {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  priority: string;
  nextFollowUp: string | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [followUps, setFollowUps] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await apiFetch('/api/v1/inquiries/analytics/stats');
        if (!statsRes.ok) {
          throw new Error('Failed to retrieve analytics data.');
        }
        const stats = await statsRes.json();
        setData(stats);

        // Fetch inquiries to filter today's follow-ups
        const inquiriesRes = await apiFetch('/api/v1/inquiries?limit=100');
        if (inquiriesRes.ok) {
          const resBody = await inquiriesRes.json();
          const list: InquiryItem[] = resBody.data || [];
          
          // Filter for items requiring follow-up today or overdue, that are not Won/Lost
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          const filtered = list.filter((item) => {
            if (!item.nextFollowUp || item.status === 'WON' || item.status === 'LOST') return false;
            const followDate = new Date(item.nextFollowUp);
            return followDate <= new Date(new Date().setHours(23, 59, 59, 999));
          });
          setFollowUps(filtered);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error loading dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <span className="login-spinner" style={{ width: '30px', height: '30px' }}></span>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* Header bar */}
      <header className="admin-header">
        <div>
          <h1 className="header-title">Welcome back, {user?.name}!</h1>
          <p className="header-meta">{currentDate} • Role: {user?.role}</p>
        </div>
      </header>

      {error && (
        <div className="login-error" style={{ margin: '0 0 25px 0' }}>
          {error}
        </div>
      )}

      {/* Today's Follow-Ups Banner */}
      {followUps.length > 0 && (
        <div className="followup-alert-banner">
          <div className="followup-alert-header">
            <span style={{ fontSize: '1.2rem' }}>📅</span>
            <strong>Action Required: You have {followUps.length} follow-up(s) scheduled for today or overdue!</strong>
          </div>
          <div className="followup-alert-list">
            {followUps.slice(0, 3).map((item) => (
              <div key={item.id} className="followup-alert-item">
                <span>
                  <strong>{item.company}</strong> ({item.contactName}) - Priority:{' '}
                  <span className={`priority-text ${item.priority.toLowerCase()}`}>{item.priority}</span>
                </span>
                <Link href={`/admin/inquiries?select=${item.id}`} className="followup-action-link">
                  Open CRM →
                </Link>
              </div>
            ))}
            {followUps.length > 3 && (
              <div style={{ fontSize: '0.85rem', marginTop: '5px', color: '#f472b6' }}>
                And {followUps.length - 3} more. Click Open CRM to view them.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metrics Widgets */}
      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="stats-card">
          <div className="stats-card-header">
            <span>Total Leads</span>
            <div className="stats-icon-wrapper icon-blue">📊</div>
          </div>
          <div className="stats-value">{data?.totalInquiries || 0}</div>
        </div>

        <div className="stats-card">
          <div className="stats-card-header">
            <span>Active Leads</span>
            <div className="stats-icon-wrapper icon-amber">⏳</div>
          </div>
          <div className="stats-value">{data?.activeLeads || 0}</div>
        </div>

        <div className="stats-card">
          <div className="stats-card-header">
            <span>Won Orders</span>
            <div className="stats-icon-wrapper icon-green">✅</div>
          </div>
          <div className="stats-value">{data?.wonLeads || 0}</div>
        </div>

        <div className="stats-card">
          <div className="stats-card-header">
            <span>Lost Leads</span>
            <div className="stats-icon-wrapper icon-red">❌</div>
          </div>
          <div className="stats-value">{data?.lostLeads || 0}</div>
        </div>

        <div className="stats-card">
          <div className="stats-card-header">
            <span>Conversion %</span>
            <div className="stats-icon-wrapper icon-pink">📈</div>
          </div>
          <div className="stats-value">{data?.conversionRate || 0}%</div>
        </div>
      </section>

      {/* Grid: Feed & Actions */}
      <div className="dashboard-grid">
        {/* Left Side: Recent Feed */}
        <div className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">Recent Customer Inquiries</h2>
            <Link href="/admin/inquiries" className="panel-link">
              View CRM →
            </Link>
          </div>

          <div className="inquiries-table-wrapper">
            {!data || data.recentInquiries.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', padding: '20px 0' }}>
                No inquiry requests received yet.
              </p>
            ) : (
              <table className="inquiries-table">
                <thead>
                  <tr>
                    <th>Organization / Name</th>
                    <th>Contact Info</th>
                    <th>Segment</th>
                    <th>Status</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentInquiries.map((inquiry) => (
                    <tr key={inquiry.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{inquiry.company}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                          {inquiry.contactName}
                        </div>
                      </td>
                      <td>
                        <div>{inquiry.email}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                          {inquiry.phone}
                        </div>
                      </td>
                      <td>{inquiry.industry || 'Other'}</td>
                      <td>
                        <span className={`status-badge ${inquiry.status.toLowerCase()}`}>
                          {inquiry.status}
                        </span>
                      </td>
                      <td>
                        {new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action Panel */}
        <div className="panel-card">
          <h2 className="panel-title" style={{ marginBottom: '20px' }}>
            Quick Operations
          </h2>
          <div className="quick-actions-list">
            <Link href="/admin/inquiries" className="action-card">
              <span>✉️</span>
              <span>Manage Inquiries CRM</span>
            </Link>

            {user?.role === 'ADMIN' ? (
              <>
                <Link href="/admin/products" className="action-card">
                  <span>🏷️</span>
                  <span>Update Product Catalog</span>
                </Link>
                <Link href="/admin/gallery" className="action-card">
                  <span>🖼️</span>
                  <span>Manage Showcase Gallery</span>
                </Link>
                <Link href="/admin/settings" className="action-card">
                  <span>⚙️</span>
                  <span>Configure Site Settings</span>
                </Link>
              </>
            ) : (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#9ca3af',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255, 255, 255, 0.05)',
                  lineHeight: '1.4',
                }}
              >
                🔒 Catalog edits and configuration adjustments are restricted to administrators. Contact management for elevation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
