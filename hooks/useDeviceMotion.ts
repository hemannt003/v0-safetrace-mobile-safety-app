import { useState, useCallback, useEffect } from 'react';

export function useDeviceMotion() {
  const [isSupported, setIsSupported] = useState(false);
  const [acceleration, setAcceleration] = useState<{x: number, y: number, z: number} | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'DeviceMotionEvent' in window);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        return permissionState === 'granted';
      } catch (error) {
        console.error('Error requesting DeviceMotion permission', error);
        return false;
      }
    }
    return true; // Not required on non-iOS
  }, []);

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        setAcceleration({ x: acc.x, y: acc.y, z: acc.z });
      }
    };

    if (isSupported) {
      window.addEventListener('devicemotion', handleMotion);
    }
    
    return () => {
      if (isSupported) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [isSupported]);

  return { acceleration, isSupported, requestPermission };
}
