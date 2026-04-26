'use client';

import { TrackingMap } from '../../components/track/TrackingMap';

export default function TrackPage({ params }: { params: { sessionId: string } }) {
  return (
    <div className="flex flex-col h-screen bg-white text-black">
      <div className="bg-danger text-white p-4 text-center font-bold tracking-wide uppercase">
        ⚠ SAFETRACE ACTIVE — Someone needs help
      </div>
      
      <div className="flex-1 relative">
        <TrackingMap sessionId={params.sessionId} />
      </div>
      
      <div className="p-6 space-y-4">
        <a 
          href="tel:112"
          className="block w-full bg-danger text-white text-center py-4 rounded-xl font-bold uppercase tracking-wide shadow-lg"
        >
          Call Emergency (112)
        </a>
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'SafeTrace Emergency',
                url: window.location.href
              });
            }
          }}
          className="w-full bg-gray-100 text-black py-4 rounded-xl font-bold uppercase tracking-wide"
        >
          Share Live Location
        </button>
      </div>
    </div>
  );
}
