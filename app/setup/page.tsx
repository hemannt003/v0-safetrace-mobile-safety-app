'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Setup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');

  const nextStep = () => setStep(prev => prev + 1);

  const requestPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
      }
      nextStep();
    } catch (e) {
      console.error(e);
      // Proceed anyway, we'll handle missing permissions gracefully later
      nextStep();
    }
  };

  const finishSetup = async () => {
    // In a real app, hash and store PIN in Supabase here
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white/10 backdrop-blur-md text-white rounded-xl">
        <h1 className="font-display text-3xl font-bold mb-6 text-center">SafeTrace Setup</h1>
        
        {step === 1 && (
          <div className="animate-slide-up space-y-4 text-center">
            <h2 className="text-xl font-semibold">Permissions</h2>
            <p className="text-gray-300 text-sm">
              SafeTrace needs microphone access to detect distress sounds, and location access to track you during an emergency.
            </p>
            <button 
              onClick={requestPermissions}
              className="w-full bg-safe text-white py-2 rounded hover:bg-safe/90"
            >
              Grant Permissions
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up space-y-4 text-center">
            <h2 className="text-xl font-semibold">Set Secret PIN</h2>
            <p className="text-gray-300 text-sm">
              Set a 4-digit PIN to access the dashboard from the calculator.
            </p>
            <input 
              type="password" 
              maxLength={4} 
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="w-full bg-white/5 border border-white/20 text-center text-2xl tracking-widest py-2 rounded text-white"
              placeholder="••••"
            />
            <button 
              onClick={finishSetup}
              disabled={pin.length < 4}
              className="w-full bg-safe text-white py-2 rounded disabled:opacity-50"
            >
              Finish Setup
            </button>
            <p className="text-xs text-gray-400 mt-4">
              Tip: Long press "=" on the calculator to enter your PIN.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
