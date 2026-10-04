'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  return (
    <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
      {orderId ? (
        <>
          <CheckCircle2 size={56} color="#16a34a" style={{ margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>Payment Successful!</h1>
          <p style={{ color: '#64748b', marginBottom: '25px', lineHeight: 1.5 }}>
            Your registration payment for KPL Season 3 was successful.
          </p>
          <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '25px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Order ID</span>
            <div style={{ fontWeight: '600', color: '#0f172a' }}>{orderId}</div>
          </div>
        </>
      ) : (
        <>
          <AlertCircle size={56} color="#eab308" style={{ margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>Payment Status</h1>
          <p style={{ color: '#64748b', marginBottom: '25px', lineHeight: 1.5 }}>
            We are processing your transaction. You will be notified shortly.
          </p>
        </>
      )}
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e8ac2f', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', transition: 'all 0.2s' }}>
        Return to Homepage <ArrowRight size={16} />
      </Link>
    </div>
  );
}

export default function PaymentStatus() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
      <Suspense fallback={<div>Loading payment status...</div>}>
        <PaymentStatusContent />
      </Suspense>
    </div>
  );
}

