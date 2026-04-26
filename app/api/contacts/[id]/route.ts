import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('trusted_contacts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updates = await req.json();

    const { data, error } = await supabase
      .from('trusted_contacts')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ contact: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
