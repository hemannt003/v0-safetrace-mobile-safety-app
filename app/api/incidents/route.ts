import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('sos_sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ incidents: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
