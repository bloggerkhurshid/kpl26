import { NextResponse } from 'next/server';
import { getGatewaySettings } from '@/lib/gatewaySettings';

export async function GET() {
  try {
    const settings = await getGatewaySettings();
    
    // Filter out payment gateway secrets (like app_id, secret_key, etc.)
    // Only return UI content flags and texts
    const contentSettings: Record<string, any> = {};
    
    // Default values if not set in DB
    const DEFAULTS: Record<string, any> = {
      // Toggles
      show_hero: 'true',
      show_stats: 'true',
      show_about: 'true',
      show_format: 'true',
      show_champions: 'true',
      show_teams: 'true',
      show_players: 'true',
      show_register: 'true',
      show_highlights: 'true',
      
      // Texts
      hero_title: 'Where local legends become champions.',
      hero_subtitle: "Assam's premier hard tennis ball cricket championship. Eight franchises. One unforgettable summer.",
      about_title: 'A different kind of cricket.',
      about_text: "KPL is more than a tournament. It is where the region's fearless players find their stage, where rivalries become traditions, and every over writes a new story.\n\nBringing together Khoraghat's finest talent in a franchise-based format, the league delivers fast, competitive hard tennis ball cricket with the energy of a packed stadium and the heart of Assam.",
      format_title: 'The format',
      format_subtitle: 'Short, intense and built for heroes.\nEvery match carries the weight of a season.',
      
      // Registration Deadline
      deadline_date: '',
      deadline_text: 'Secure your franchise or player spot before the registration closes.',
    };

    // Combine DB settings with defaults
    for (const [key, defaultVal] of Object.entries(DEFAULTS)) {
      contentSettings[key] = settings[key] !== undefined ? settings[key] : defaultVal;
    }

    return NextResponse.json(contentSettings);
  } catch (err) {
    console.error('Failed to fetch content settings:', err);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
