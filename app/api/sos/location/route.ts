import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, lat, lng, accuracy } = await req.json();

    if (!sessionId || !lat || !lng) {
      return NextResponse.json({ error: 'Missing location data' }, { status: 400 });
    }

    // Insert into gps_points table
    // Note: Supabase Realtime will automatically broadcast this insert
    const { error } = await supabase.from('gps_points').insert({
      session_id: sessionId,
      lat,
      lng,
      accuracy
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] /api/sos/location error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
