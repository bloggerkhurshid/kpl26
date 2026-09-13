'use client';

import Link from 'next/link';
import { Home, Trophy, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '48px 32px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          color: '#d4af37'
        }}>
          <ShieldAlert size={36} />
        </div>

        <h1 style={{
          fontSize: '64px',
          fontWeight: 800,
          margin: '0 0 8px 0',
          background: 'linear-gradient(135deg, #ffffff 0%, #d4af37 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          404
        </h1>

        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f8fafc', margin: '0 0 12px 0' }}>
          Page Not Found
        </h2>

        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 32px 0', lineHeight: 1.6 }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #d4af37 0%, #aa820a 100%)',
            color: '#0f172a',
            padding: '14px 24px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '15px',
            textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
            transition: 'transform 0.2s'
          }}>
            <Home size={18} />
            Back to Homepage
          </Link>

          <Link href="/admin" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none'
          }}>
            <Trophy size={16} />
            Go to Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
