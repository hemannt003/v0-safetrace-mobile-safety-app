import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const supabase = createServerClient();

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Auth send-otp error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
