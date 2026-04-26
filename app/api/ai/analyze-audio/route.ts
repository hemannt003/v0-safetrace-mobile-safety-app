import { NextResponse } from 'next/server';
import { analyzeAudioClip } from '../../../../lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const { audioData } = await req.json();

    if (!audioData) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    const result = await analyzeAudioClip(audioData);

    if (!result) {
      return NextResponse.json({ error: 'AI Analysis failed' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] /api/ai/analyze-audio error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
