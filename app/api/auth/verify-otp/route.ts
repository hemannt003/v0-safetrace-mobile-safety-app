import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { phone, token } = await req.json();
    const supabase = createServerClient();

    const { data: { session }, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });

    if (error || !session) {
      throw new Error(error?.message || 'Verification failed');
    }

    return NextResponse.json({ success: true, user: session.user });
  } catch (error: any) {
    console.error('[API] Auth verify-otp error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
