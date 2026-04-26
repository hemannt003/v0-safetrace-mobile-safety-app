import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../../lib/supabase/server';

// GET /api/sos/track/[sessionId]
// PUBLIC endpoint — no auth required (contacted by contacts)
export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createServerClient();
    const { sessionId } = params;

    // 1. Query sos_sessions by id (expose: status, started_at ONLY)
    // We use the service role key or public policy to fetch this
    const { data: sessionData, error: sessionError } = await supabase
      .from('sos_sessions')
      .select('status, started_at')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 2. Query gps_points for session (expose: lat, lng, recorded_at)
    // Order by recorded_at DESC to get newest points first
    const { data: trailData, error: trailError } = await supabase
      .from('gps_points')
      .select('lat, lng, recorded_at')
      .eq('session_id', sessionId)
      .order('recorded_at', { ascending: false });

    if (trailError) {
      console.error('[API] Error fetching GPS trail:', trailError);
    }

    // 3. Return combined data
    return NextResponse.json({ 
      session: { 
        status: sessionData.status, 
        started_at: sessionData.started_at 
      }, 
      trail: trailData || [] 
    });
  } catch (error: any) {
    console.error(`[API] /api/sos/track/[sessionId] error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
