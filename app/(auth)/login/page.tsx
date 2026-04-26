'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        // Store phone temporarily for verify page
        sessionStorage.setItem('authPhone', phone);
        router.push('/verify');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send OTP');
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
        <h1 className="font-display text-3xl font-bold mb-6 text-center">SafeTrace Login</h1>
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <Input 
              type="tel" 
              placeholder="+919876543210" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
