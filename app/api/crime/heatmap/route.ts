import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { lat, lng, radius } = await req.json();
    const supabase = createServerClient();
    
    // In a real app, this would query the crime_tiles table with PostGIS
    // For now, we simulate a mock response around the requested location
    
    const mockTiles = [
      { lat: lat + 0.001, lng: lng + 0.001, risk_score: 0.8 },
      { lat: lat - 0.002, lng: lng + 0.001, risk_score: 0.4 },
      { lat: lat + 0.001, lng: lng - 0.002, risk_score: 0.6 }
    ];

    return NextResponse.json({ tiles: mockTiles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
