import { NextResponse } from 'next/server';
import { assessContextualRisk } from '../../../../lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const { signals, location, timeOfDay, crimeScore } = await req.json();

    if (!signals) {
      return NextResponse.json({ error: 'Missing signals data' }, { status: 400 });
    }

    const result = await assessContextualRisk(signals, location || 'Unknown', timeOfDay || 'Unknown', crimeScore || 0);

    if (!result) {
      return NextResponse.json({ error: 'AI Risk Assessment failed' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] /api/ai/risk-assessment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
