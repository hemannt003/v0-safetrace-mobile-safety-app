import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { sendSOSAlert } from '../../../../lib/twilio';

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { triggerData, initialGPS } = await req.json();

    // Create session record
    const { data: sosSession, error: sosError } = await supabase
      .from('sos_sessions')
      .insert({
        user_id: session.user.id,
        trigger_type: triggerData.type || 'manual',
        trigger_data: triggerData.signals || [],
        risk_score: triggerData.score || 1.0,
        status: 'active'
      })
      .select()
      .single();

    if (sosError || !sosSession) {
      throw new Error(sosError?.message || 'Failed to create SOS session');
    }

    // Insert initial GPS if provided
    if (initialGPS) {
      await supabase.from('gps_points').insert({
        session_id: sosSession.id,
        lat: initialGPS.lat,
        lng: initialGPS.lng,
        accuracy: initialGPS.accuracy
      });
    }

    // Fetch contacts
    const { data: contacts } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('notify_sms', true);

    let contactsNotified = 0;

    // Send SMS via Twilio
    if (contacts && contacts.length > 0) {
      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .single();
        
      const userName = profile?.name || 'A SafeTrace User';
      const mapsLink = initialGPS ? `https://maps.google.com/?q=${initialGPS.lat},${initialGPS.lng}` : 'Location updating...';

      const smsPromises = contacts.map(c => 
        sendSOSAlert(c.phone, userName, sosSession.id, mapsLink)
      );
      
      const results = await Promise.allSettled(smsPromises);
      contactsNotified = results.filter(r => r.status === 'fulfilled' && r.value).length;
      
      // Update session with notification count
      await supabase.from('sos_sessions').update({ contacts_notified: contactsNotified }).eq('id', sosSession.id);
    }

    return NextResponse.json({ 
      sessionId: sosSession.id, 
      contactsNotified 
    });
  } catch (error: any) {
    console.error('[API] /api/sos/fire error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
