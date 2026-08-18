'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import './admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="loading-panel">
        <span className="login-spinner" style={{ width: '45px', height: '45px', borderWidth: '4px' }}></span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hasAccess = user.role === 'ADMIN' || user.role === 'SALES' || user.role === 'MANAGER';
  if (!hasAccess) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-card">
          <div className="unauthorized-icon">⚠️</div>
          <h2 className="unauthorized-title">Access Denied</h2>
          <p className="unauthorized-text">
            Your account ({user.email}) does not have administrative permissions to access the control panel.
          </p>
          <Link href="/" className="unauthorized-btn">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Inquiries CRM', path: '/admin/inquiries', icon: '✉️' },
    { name: 'Orders Pipeline', path: '/admin/orders', icon: '📦' },
    { name: 'Product Catalog', path: '/admin/products', icon: '🏷️', adminOnly: true },
    { name: 'Gallery Showcase', path: '/admin/gallery', icon: '🖼️', adminOnly: true },
    { name: 'Testimonials', path: '/admin/testimonials', icon: '⭐', adminOnly: true },
    { name: 'FAQ Manager', path: '/admin/faq', icon: '❓', adminOnly: true },
    { name: 'Site Settings', path: '/admin/settings', icon: '⚙️', adminOnly: true },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div>
          <div className="sidebar-brand">RIYA SILK</div>
          <nav>
            <ul className="sidebar-menu">
              {menuItems.map((item) => {
                if (item.adminOnly && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
                  return null;
                }
                const isActive = pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`sidebar-link ${isActive ? 'active' : ''}`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="sidebar-user">
          <div className="user-name" title={user.name}>{user.name}</div>
          <div className="user-role">{user.role} Portal</div>
          <button className="logout-btn" onClick={handleLogout}>
            Exit Session
          </button>
        </div>
      </aside>

      <main className="admin-content">{children}</main>
    </div>
  );
}
