import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { resolveKey } from '@/lib/gatewaySettings';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderAmount, referenceId, paymentStatus, signature } = body;

    const secretKey = await resolveKey('gateway_cashfree_secret_key', 'CASHFREE_SECRET_KEY');
    if (!secretKey) {
      return NextResponse.json({ error: 'Cashfree credentials not configured' }, { status: 500 });
    }

    const signatureData = `${orderId}${orderAmount}${referenceId}${paymentStatus}`;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureData)
      .digest('base64');

    return NextResponse.json({
      verified: expectedSignature === signature,
      orderId,
      paymentStatus,
    });
  } catch (err) {
    console.error('Cashfree verify error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
