import { useDeviceMotion } from '../../hooks/useDeviceMotion';
import { Card } from '../ui/Card';

export function SensorGrid() {
  const { acceleration } = useDeviceMotion();

  const motionMagnitude = acceleration 
    ? Math.sqrt(acceleration.x**2 + acceleration.y**2 + acceleration.z**2) 
    : 0;

  const motionDisplay = motionMagnitude > 9.8 ? (motionMagnitude - 9.8).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4 bg-white/5 border-none">
        <h3 className="text-xs text-gray-400 mb-1">ACCELEROMETER</h3>
        <div className="text-xl font-mono">{motionDisplay} g</div>
      </Card>
      
      <Card className="p-4 bg-white/5 border-none">
        <h3 className="text-xs text-gray-400 mb-1">AUDIO RMS</h3>
        <div className="text-xl font-mono">0.02</div>
      </Card>
      
      <Card className="p-4 bg-white/5 border-none">
        <h3 className="text-xs text-gray-400 mb-1">LOCATION RISK</h3>
        <div className="text-xl font-mono">LOW</div>
      </Card>

      <Card className="p-4 bg-white/5 border-none">
        <h3 className="text-xs text-gray-400 mb-1">GYROSCOPE</h3>
        <div className="text-xl font-mono">-- rad/s</div>
      </Card>
    </div>
  );
}
