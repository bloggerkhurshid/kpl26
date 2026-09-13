import { NextResponse } from 'next/server';
import { getGatewaySettings } from '@/lib/gatewaySettings';

export async function GET() {
  try {
    const settings = await getGatewaySettings();
    
    // Only expose non-sensitive public settings
    const publicSettings = {
      fee_player: parseInt(settings['fee_player'] || '500'),
      fee_foreign_player: parseInt(settings['fee_foreign_player'] || '1000'),
      fee_team: parseInt(settings['fee_team'] || '5000'),
      active_gateway: settings['active_gateway'] || 'razorpay',
    };

    return NextResponse.json(publicSettings);
  } catch (err) {
    console.error('Failed to fetch public settings:', err);
    return NextResponse.json({ fee_player: 500, fee_foreign_player: 1000, fee_team: 5000, active_gateway: 'razorpay' }); // Fallback defaults
  }
}
