import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface AdvancedTelemetryProps {
  driver: {
    abbreviation: string;
    fullName: string;
    team: string;
    teamColor: string;
    number: number;
  };
  telemetry: {
    speed: number;
    throttle: number;
    brake: number;
    gear: number;
    rpm: number;
    tireWear: {
      fl: number;
      fr: number;
      rl: number;
      rr: number;
    };
    steeringAngle: number;
    gForce: { x: number; y: number; z: number };
  };
  onClose: () => void;
}

export default function AdvancedTelemetry({ driver, telemetry, onClose }: AdvancedTelemetryProps) {
  // Generate historical data for charts (simulating sensor readings)
  const speedHistory = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    speed: Math.max(0, telemetry.speed + Math.sin(i * 0.5) * 30)
  }));

  const throttleBrakeHistory = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    throttle: Math.max(0, Math.min(100, telemetry.throttle + Math.sin(i * 0.3) * 20)),
    brake: Math.max(0, Math.min(100, telemetry.brake + Math.cos(i * 0.4) * 15))
  }));

  const gForceHistory = Array.from({ length: 20 }, (_, i) => ({
    time: i,
    x: telemetry.gForce.x + Math.sin(i * 0.2) * 0.5,
    y: telemetry.gForce.y + Math.cos(i * 0.3) * 0.5,
    z: telemetry.gForce.z + Math.sin(i * 0.1) * 0.3
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-6 right-6 w-[600px]"
      style={{
        background: 'rgba(3, 3, 3, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 255, 255, 0.4)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-12 rounded"
            style={{ background: driver.teamColor }}
          />
          <div>
            <div className="text-sm font-bold text-white">{driver.fullName}</div>
            <div className="text-[10px] text-white/50">{driver.team} · #{driver.number} · LIVE TELEMETRY</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        {/* Speed Chart */}
        <div>
          <div className="text-[10px] text-cyan-400 mb-2 font-bold tracking-wider">SPEED (km/h)</div>
          <div className="h-32 rounded-lg overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedHistory}>
                <defs>
                  <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 350]} />
                <Area type="monotone" dataKey="speed" stroke="#06b6d4" strokeWidth={2} fill="url(#speedGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-2xl font-bold text-white mt-2 tabular-nums">{telemetry.speed} <span className="text-sm text-white/50">km/h</span></div>
        </div>

        {/* Throttle/Brake Chart */}
        <div>
          <div className="text-[10px] text-cyan-400 mb-2 font-bold tracking-wider">THROTTLE / BRAKE (%)</div>
          <div className="h-32 rounded-lg overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throttleBrakeHistory}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 100]} />
                <Line type="monotone" dataKey="throttle" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="brake" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            <div>
              <span className="text-xs text-green-400">THR:</span>
              <span className="text-lg font-bold text-white ml-1 tabular-nums">{telemetry.throttle}%</span>
            </div>
            <div>
              <span className="text-xs text-red-400">BRK:</span>
              <span className="text-lg font-bold text-white ml-1 tabular-nums">{telemetry.brake}%</span>
            </div>
          </div>
        </div>

        {/* G-Force Chart */}
        <div>
          <div className="text-[10px] text-cyan-400 mb-2 font-bold tracking-wider">G-FORCE (X/Y/Z)</div>
          <div className="h-32 rounded-lg overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gForceHistory}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[-3, 3]} />
                <Line type="monotone" dataKey="x" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="y" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="z" stroke="#ec4899" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 mt-2 text-xs">
            <div className="text-orange-400">X: {telemetry.gForce.x.toFixed(2)}g</div>
            <div className="text-purple-400">Y: {telemetry.gForce.y.toFixed(2)}g</div>
            <div className="text-pink-400">Z: {telemetry.gForce.z.toFixed(2)}g</div>
          </div>
        </div>

        {/* Steering + Gear + RPM */}
        <div className="space-y-3">
          {/* Steering Angle */}
          <div>
            <div className="text-[10px] text-cyan-400 mb-2 font-bold tracking-wider">STEERING ANGLE</div>
            <div className="relative h-12 bg-black/40 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-2 bg-white/10 relative">
                  <motion.div
                    className="absolute top-0 h-full w-1 bg-yellow-400"
                    style={{
                      left: `${50 + (telemetry.steeringAngle / 360) * 100}%`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                </div>
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white tabular-nums">
                {telemetry.steeringAngle}°
              </div>
            </div>
          </div>

          {/* Gear + RPM */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 rounded-lg p-3">
              <div className="text-[10px] text-cyan-400 mb-1 font-bold">GEAR</div>
              <div className="text-3xl font-bold text-white tabular-nums">{telemetry.gear}</div>
            </div>
            <div className="bg-black/40 rounded-lg p-3">
              <div className="text-[10px] text-cyan-400 mb-1 font-bold">RPM</div>
              <div className="text-xl font-bold text-white tabular-nums">{telemetry.rpm.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Tire Temperatures */}
        <div className="col-span-2">
          <div className="text-[10px] text-cyan-400 mb-2 font-bold tracking-wider">TIRE WEAR (%)</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'FL', value: telemetry.tireWear.fl },
              { label: 'FR', value: telemetry.tireWear.fr },
              { label: 'RL', value: telemetry.tireWear.rl },
              { label: 'RR', value: telemetry.tireWear.rr }
            ].map((tire) => (
              <div key={tire.label} className="bg-black/40 rounded-lg p-2">
                <div className="text-[9px] text-white/60 mb-1">{tire.label}</div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full ${
                      tire.value > 70 ? 'bg-green-500' :
                      tire.value > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${tire.value}%` }}
                  />
                </div>
                <div className="text-xs font-bold text-white tabular-nums">{tire.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
