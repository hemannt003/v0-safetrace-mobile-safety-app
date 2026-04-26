import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: incident, error: incidentError } = await supabase
      .from('sos_sessions')
      .select('*')
      .eq('id', params.sessionId)
      .eq('user_id', session.user.id)
      .single();

    if (incidentError || !incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const { data: trail, error: trailError } = await supabase
      .from('gps_points')
      .select('*')
      .eq('session_id', params.sessionId)
      .order('recorded_at', { ascending: true });

    return NextResponse.json({ 
      incident,
      trail: trail || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
