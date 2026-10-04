import { NextRequest, NextResponse } from 'next/server';
import { resolveKey, getGatewaySettings, isProductionMode } from '@/lib/gatewaySettings';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = 'INR', customerName, customerEmail, customerPhone, returnUrl, orderId } = body;

    // Resolve keys: DB first, then env var fallback
    const [appId, secretKey, settings] = await Promise.all([
      resolveKey('gateway_cashfree_app_id', 'CASHFREE_APP_ID'),
      resolveKey('gateway_cashfree_secret_key', 'CASHFREE_SECRET_KEY'),
      getGatewaySettings(),
    ]);

    if (!appId || !secretKey) {
      return NextResponse.json({ error: 'Cashfree credentials not configured. Please add them in Admin → Settings.' }, { status: 500 });
    }

    if (appId.includes('XXXXX') || secretKey.includes('XXXXX')) {
      return NextResponse.json({ 
        error: 'Cashfree keys are not configured. Please use UPI Direct payment or configure active Cashfree keys in Admin Settings.' 
      }, { status: 400 });
    }

    const isProd = isProductionMode(settings);
    const baseUrl = isProd
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    const payload = {
      order_id: (orderId ? `${orderId}_${Date.now()}` : `kpl_${Date.now()}`).substring(0, 50),
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_name: customerName || 'KPL User',
        customer_phone: customerPhone || '9999999999',
        ...(customerEmail && customerEmail.trim() !== '' ? { customer_email: customerEmail } : {})
      },
      order_meta: {
        return_url: (returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'}/payment-status?order_id={order_id}`).replace('http://', 'https://'),
      },
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Cashfree Response:', data); // DEBUG LOG

    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Cashfree order creation failed' }, { status: 400 });
    }

    return NextResponse.json({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderStatus: data.order_status,
      mode: isProd ? 'production' : 'sandbox',
    });
  } catch (err: any) {
    console.error('Cashfree create-order error:', err);
    return NextResponse.json({ error: err?.message || 'Cashfree server error' }, { status: 500 });
  }
}
