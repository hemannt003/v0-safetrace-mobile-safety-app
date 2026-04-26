'use client';

export function PulsingRing() {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <div className="absolute w-full h-full rounded-full border-4 border-white opacity-80 animate-pulse-ring-1" />
      <div className="absolute w-full h-full rounded-full border-4 border-white opacity-80 animate-pulse-ring-2" />
      <div className="absolute w-full h-full rounded-full border-4 border-white opacity-80 animate-pulse-ring-3" />
      
      <div className="relative z-10 w-24 h-24 bg-white text-danger rounded-full flex items-center justify-center font-display font-bold text-6xl shadow-2xl">
        !
      </div>
    </div>
  );
}
