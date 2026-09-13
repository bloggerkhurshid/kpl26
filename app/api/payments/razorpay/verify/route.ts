import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { resolveKey } from '@/lib/gatewaySettings';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const keySecret = await resolveKey('gateway_razorpay_key_secret', 'RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      return NextResponse.json({ error: 'Razorpay credentials not configured' }, { status: 500 });
    }

    const signatureData = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(signatureData)
      .digest('hex');

    return NextResponse.json({
      verified: expectedSignature === razorpay_signature,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
