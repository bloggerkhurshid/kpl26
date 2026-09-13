import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { resolveKey } from '@/lib/gatewaySettings';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = 'INR', receipt, notes } = body;

    // Resolve keys: DB first, then env var fallback
    const [keyId, keySecret] = await Promise.all([
      resolveKey('gateway_razorpay_key_id', 'RAZORPAY_KEY_ID'),
      resolveKey('gateway_razorpay_key_secret', 'RAZORPAY_KEY_SECRET'),
    ]);

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay credentials not configured. Please add them in Admin → Settings.' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: receipt || `kpl_${Date.now()}`,
      notes: notes || {},
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId, // Pass keyId to frontend
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
