import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface TelemetryData {
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
}

interface DriverTelemetryProps {
  driver: {
    abbreviation: string;
    fullName: string;
    team: string;
    teamColor: string;
    number: number;
  };
  telemetry: TelemetryData;
  onClose: () => void;
}

export default function DriverTelemetry({ driver, telemetry, onClose }: DriverTelemetryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-6 right-6 w-80"
      style={{
        background: 'rgba(3, 3, 3, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-10 rounded"
            style={{ background: driver.teamColor }}
          />
          <div>
            <div className="text-xs font-bold text-white">{driver.fullName}</div>
            <div className="text-[10px] text-white/50">{driver.team} · #{driver.number}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Speed Gauge */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="text-[10px] text-white/40 mb-2">SPEED</div>
        <div className="flex items-end gap-2">
          <div className="text-3xl font-bold text-white tabular-nums">{telemetry.speed}</div>
          <div className="text-sm text-white/50 mb-1">km/h</div>
        </div>
        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${(telemetry.speed / 350) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Throttle & Brake */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-white/40 mb-2">THROTTLE</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-16 bg-white/10 rounded overflow-hidden relative">
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-green-500"
                  initial={{ height: 0 }}
                  animate={{ height: `${telemetry.throttle}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <div className="text-sm font-bold text-white tabular-nums">{telemetry.throttle}%</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-white/40 mb-2">BRAKE</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-16 bg-white/10 rounded overflow-hidden relative">
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-red-500"
                  initial={{ height: 0 }}
                  animate={{ height: `${telemetry.brake}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <div className="text-sm font-bold text-white tabular-nums">{telemetry.brake}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gear & RPM */}
      <div className="px-4 py-3 border-b border-white/10 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-white/40 mb-1">GEAR</div>
          <div className="text-2xl font-bold text-cyan-400 tabular-nums">{telemetry.gear}</div>
        </div>
        <div>
          <div className="text-[10px] text-white/40 mb-1">RPM</div>
          <div className="text-2xl font-bold text-white tabular-nums">{telemetry.rpm.toLocaleString()}</div>
        </div>
      </div>

      {/* Tire Wear */}
      <div className="px-4 py-3">
        <div className="text-[10px] text-white/40 mb-3">TIRE WEAR</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'FL', value: telemetry.tireWear.fl },
            { label: 'FR', value: telemetry.tireWear.fr },
            { label: 'RL', value: telemetry.tireWear.rl },
            { label: 'RR', value: telemetry.tireWear.rr }
          ].map((tire) => (
            <div key={tire.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/60">{tire.label}</span>
                <span className="text-xs font-bold text-white">{tire.value}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    tire.value > 70 ? 'bg-green-500' :
                    tire.value > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${tire.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
