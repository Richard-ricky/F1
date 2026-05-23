import { useState } from 'react';

interface RaceDataTableProps {
  drivers: any[];
}

export default function RaceDataTable({ drivers }: RaceDataTableProps) {
  const [sortBy, setSortBy] = useState<'position' | 'name' | 'team'>('position');

  const sortedDrivers = [...drivers].sort((a, b) => {
    if (sortBy === 'position') return a.position - b.position;
    if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
    return a.team.localeCompare(b.team);
  });

  return (
    <div className="h-full flex flex-col" style={{
      background: 'rgba(3, 3, 3, 0.75)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    }}>
      <div className="px-4 py-3 border-b border-white/10">
        <div className="text-xs font-bold text-cyan-400 tracking-wider">RACE DATA TABLE</div>
        <div className="text-[10px] text-white/50 mt-0.5">Complete Driver Statistics</div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-black/60 backdrop-blur-md">
            <tr className="text-[10px] text-white/60 border-b border-white/10">
              <th className="px-3 py-2 text-left cursor-pointer hover:text-cyan-400" onClick={() => setSortBy('position')}>POS</th>
              <th className="px-3 py-2 text-left">FLAG</th>
              <th className="px-3 py-2 text-left cursor-pointer hover:text-cyan-400" onClick={() => setSortBy('name')}>DRIVER</th>
              <th className="px-3 py-2 text-left cursor-pointer hover:text-cyan-400" onClick={() => setSortBy('team')}>TEAM</th>
              <th className="px-3 py-2 text-left">NUMBER</th>
              <th className="px-3 py-2 text-left">GAP</th>
              <th className="px-3 py-2 text-left">LAST LAP</th>
              <th className="px-3 py-2 text-left">TIRE</th>
              <th className="px-3 py-2 text-left">AGE</th>
            </tr>
          </thead>
          <tbody>
            {sortedDrivers.map((driver, idx) => (
              <tr
                key={driver.id}
                className={`border-b border-white/5 hover:bg-cyan-500/10 transition-colors ${
                  idx % 2 === 0 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <td className="px-3 py-2 font-bold text-white">{driver.position}</td>
                <td className="px-3 py-2">{driver.flag}</td>
                <td className="px-3 py-2 text-white font-medium">{driver.fullName}</td>
                <td className="px-3 py-2 text-white/70">{driver.team}</td>
                <td className="px-3 py-2 text-white/70">{driver.number}</td>
                <td className="px-3 py-2 text-white/70">{driver.gap}</td>
                <td className="px-3 py-2 font-mono text-white/70">{driver.lastLap}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    driver.tire === 'SOFT' ? 'bg-red-500/20 text-red-400' :
                    driver.tire === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-white/20 text-white'
                  }`}>
                    {driver.tire}
                  </span>
                </td>
                <td className="px-3 py-2 text-white/70">{driver.tireAge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
