import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, reason, evidenceKey } = await req.json();

    // Verify session belongs to user
    const { data: sosSession, error: checkError } = await supabase
      .from('sos_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', session.user.id)
      .single();

    if (checkError || !sosSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update session status
    const endTime = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('sos_sessions')
      .update({
        status: 'cancelled',
        ended_at: endTime,
        evidence_key: evidenceKey || null,
        metadata: { cancel_reason: reason }
      })
      .eq('id', sessionId);

    if (updateError) throw new Error(updateError.message);

    // Fetch GPS points count
    const { count } = await supabase
      .from('gps_points')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    return NextResponse.json({ 
      success: true,
      report: {
        sessionId,
        startTime: new Date(sosSession.started_at).getTime(),
        endTime: new Date(endTime).getTime(),
        reason,
        pointCount: count || 0,
        evidenceKey: evidenceKey || null,
        contactsNotified: sosSession.contacts_notified,
        riskScore: sosSession.risk_score
      }
    });
  } catch (error: any) {
    console.error('[API] /api/sos/cancel error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
