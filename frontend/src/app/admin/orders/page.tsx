'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import '../admin.css';

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  company: string;
  email: string;
  phone: string;
  totalQuantity: number;
  totalAmount: number;
  advancePayment: number;
  remainingPayment: number;
  status: string;
  deliveryDate?: string | null;
  dispatchStatus?: string | null;
  notes?: string | null;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const statusColumns = [
    { key: 'ORDER_CONFIRMED', label: 'Order Confirmed', icon: '📝', color: '#60a5fa' },
    { key: 'IN_PRODUCTION', label: 'In Production', icon: '⚙️', color: '#f59e0b' },
    { key: 'QUALITY_CHECK', label: 'Quality Check', icon: '🔍', color: '#a855f7' },
    { key: 'DISPATCHED', label: 'Dispatched', icon: '🚚', color: '#ec4899' },
    { key: 'DELIVERED', label: 'Delivered', icon: '📦', color: '#10b981' },
    { key: 'COMPLETED', label: 'Completed', icon: '✅', color: '#059669' },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        throw new Error('Failed to load production orders.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading order pipeline.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await apiFetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update order status.');
      setSuccessMsg(`Order status updated to ${newStatus}`);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="crm-container">
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Production & Order Pipeline ERP</h1>
          <p className="crm-subtitle">
            Track uniform manufacturing pipeline from confirmed orders through production, quality checks, dispatch, and final delivery.
          </p>
        </div>
      </div>

      {successMsg && <div className="crm-success-banner">✅ {successMsg}</div>}
      {error && <div className="crm-error-banner">⚠️ {error}</div>}

      {/* Kanban / Pipeline Columns */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <span className="login-spinner" style={{ width: '40px', height: '40px' }}></span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px', marginTop: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
          {statusColumns.map((col) => {
            const columnOrders = orders.filter((o) => o.status === col.key);
            return (
              <div
                key={col.key}
                style={{
                  background: '#0f172a',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: '220px',
                  minHeight: '500px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{col.icon}</span>
                    <h3 style={{ fontSize: '0.9rem', color: '#f3f4f6', fontWeight: 700 }}>{col.label}</h3>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.08)', color: col.color, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {columnOrders.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {columnOrders.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#475569', textAlign: 'center', marginTop: '40px' }}>
                      No orders in this stage
                    </div>
                  ) : (
                    columnOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        style={{
                          background: '#1e293b',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: col.color, fontWeight: 700 }}>{ord.orderNumber}</span>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{ord.totalQuantity} pcs</span>
                        </div>

                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{ord.company}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>{ord.customerName}</div>

                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#cbd5e1' }}>₹{ord.totalAmount.toLocaleString()}</span>
                          <span style={{ color: ord.remainingPayment > 0 ? '#fca5a5' : '#86efac' }}>
                            {ord.remainingPayment > 0 ? `Due: ₹${ord.remainingPayment.toLocaleString()}` : 'Paid'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Order Detail Modal */}
      {selectedOrder && (
        <div className="crm-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="crm-modal-card" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details: {selectedOrder.orderNumber}</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>Customer & Company</label>
                <div style={{ fontWeight: 600, color: '#fff' }}>{selectedOrder.company}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{selectedOrder.customerName}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>Contact Info</label>
                <div style={{ fontSize: '0.85rem', color: '#fff' }}>{selectedOrder.email}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{selectedOrder.phone}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>Order Quantity</label>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>{selectedOrder.totalQuantity} Units</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af' }}>Financial Breakdown</label>
                <div style={{ fontSize: '0.85rem', color: '#fff' }}>Total: ₹{selectedOrder.totalAmount.toLocaleString()}</div>
                <div style={{ fontSize: '0.85rem', color: '#86efac' }}>Advance: ₹{selectedOrder.advancePayment.toLocaleString()}</div>
                <div style={{ fontSize: '0.85rem', color: '#fca5a5' }}>Remaining: ₹{selectedOrder.remainingPayment.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>Transition Stage</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                disabled={updatingStatus}
                style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
              >
                {statusColumns.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.icon} {col.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="new-inquiry-btn" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
