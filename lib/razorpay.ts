// Razorpay checkout helper

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
}

export interface RazorpayOptions {
  orderId: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  onFailure?: (error: unknown) => void;
}

export async function initiateRazorpayPayment(opts: RazorpayOptions): Promise<void> {
  await loadRazorpayScript();
  const rzp = new window.Razorpay({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: opts.amount,
    currency: opts.currency || 'INR',
    name: opts.name || 'KPL Season 3',
    description: opts.description || 'Registration Fee',
    order_id: opts.orderId,
    prefill: opts.prefill || {},
    theme: { color: '#e8ac2f' },
    handler: opts.onSuccess,
    modal: {
      ondismiss: () => opts.onFailure?.('dismissed'),
    },
  });
  rzp.open();
}
