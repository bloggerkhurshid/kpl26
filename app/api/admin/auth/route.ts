import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin password not configured' }, { status: 500 });
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Generate a simple session token
    const token = crypto
      .createHmac('sha256', adminPassword)
      .update(`kpl-admin-${Date.now()}`)
      .digest('hex');

    return NextResponse.json({ token, success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
