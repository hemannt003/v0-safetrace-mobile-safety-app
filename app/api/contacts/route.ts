import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase/server';
import { sendWelcomeSMS } from '../../../lib/twilio';

export async function GET(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ contacts: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, phone, relation } = await req.json();

    // Basic validation
    if (!name || !phone || !phone.startsWith('+')) {
      return NextResponse.json({ error: 'Invalid data format. Phone must include country code.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('trusted_contacts')
      .insert({
        user_id: session.user.id,
        name,
        phone,
        relation
      })
      .select()
      .single();

    if (error) throw error;

    // Send welcome SMS
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', session.user.id).single();
    const userName = profile?.name || 'A SafeTrace user';
    await sendWelcomeSMS(phone, name, userName);

    return NextResponse.json({ contact: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
