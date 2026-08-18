'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import './login.css';

function LoginPageContent() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      const redirectUrl = searchParams.get('redirect') || '/admin';
      router.push(redirectUrl);
    }
  }, [user, loading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">RIYA SILK</div>
          <h2 className="login-title">Control Center</h2>
          <p className="login-subtitle">Sign in to access administration dashboard</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label className="login-label" htmlFor="email">
              Email Address
            </label>
            <div className="login-input-wrapper">
              <input
                className="login-input"
                id="email"
                type="email"
                placeholder="admin@riyasilk.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="login-form-group">
            <label className="login-label" htmlFor="password">
              Password
            </label>
            <div className="login-input-wrapper">
              <input
                className="login-input"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            className="login-btn"
            type="submit"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? (
              <>
                <span className="login-spinner"></span>
                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <Link className="login-link" href="/">
            Back to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="login-container">
        <div className="login-card" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <span className="login-spinner" style={{ width: '30px', height: '30px' }}></span>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

