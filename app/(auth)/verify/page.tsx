'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function Verify() {
  const [token, setToken] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const p = sessionStorage.getItem('authPhone');
    if (!p) router.push('/login');
    else setPhone(p);
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token })
      });
      if (res.ok) {
        sessionStorage.removeItem('authPhone');
        router.push('/setup');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to verify OTP');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-white/10 backdrop-blur-md text-white">
        <h1 className="font-display text-3xl font-bold mb-6 text-center">Verify OTP</h1>
        <p className="text-center text-sm text-gray-300 mb-4">Sent to {phone}</p>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">6-Digit Code</label>
            <Input 
              type="text" 
              placeholder="123456" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              maxLength={6}
              className="bg-white/5 border-white/20 text-white text-center text-2xl tracking-widest"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
