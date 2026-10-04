// Cashfree JS SDK loader helper

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cashfree: any;
  }
}

export function loadCashfreeSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if (window.Cashfree) return resolve();
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });
}

export async function initiateCashfreePayment(paymentSessionId: string): Promise<void> {
  await loadCashfreeSDK();
  const cashfree = window.Cashfree({ mode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox' });
  cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' });
}
