interface CarIconProps {
  color: string;
  rotation?: number;
  scale?: number;
}

export default function CarIcon({ color, rotation = 0, scale = 1 }: CarIconProps) {
  return (
    <svg
      width={40 * scale}
      height={40 * scale}
      viewBox="0 0 40 40"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Car body */}
      <g>
        {/* Rear wing */}
        <rect x="8" y="4" width="24" height="2" fill={color} opacity="0.8" />

        {/* Main body */}
        <path
          d="M 12 6 L 12 10 L 10 12 L 10 24 L 12 26 L 12 30 L 28 30 L 28 26 L 30 24 L 30 12 L 28 10 L 28 6 Z"
          fill={color}
          stroke="#000"
          strokeWidth="0.5"
        />

        {/* Cockpit */}
        <ellipse cx="20" cy="14" rx="6" ry="8" fill="#1a1a1a" opacity="0.9" />

        {/* Front wing */}
        <rect x="8" y="34" width="24" height="2" fill={color} opacity="0.8" />

        {/* Wheels */}
        <circle cx="12" cy="10" r="2.5" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
        <circle cx="28" cy="10" r="2.5" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
        <circle cx="12" cy="26" r="2.5" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
        <circle cx="28" cy="26" r="2.5" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />

        {/* Tire details */}
        <circle cx="12" cy="10" r="1.5" fill="#666" />
        <circle cx="28" cy="10" r="1.5" fill="#666" />
        <circle cx="12" cy="26" r="1.5" fill="#666" />
        <circle cx="28" cy="26" r="1.5" fill="#666" />

        {/* Driver number area */}
        <rect x="17" y="18" width="6" height="6" rx="1" fill="#fff" opacity="0.3" />
      </g>
    </svg>
  );
}
