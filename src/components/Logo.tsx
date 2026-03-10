export default function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* C shape - centered at (50,50), radius 38, opening right */}
      <path
        d="M69 17A38 38 0 1 0 69 83"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Orbital ring - centered at (50,50), tilted ellipse through the C opening */}
      <ellipse
        cx="50"
        cy="50"
        rx="14"
        ry="36"
        transform="rotate(-30 50 50)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="4 6"
        fill="none"
        opacity="0.5"
      />
      {/* Center dot */}
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
      {/* Orbiting dot */}
      <circle cx="69" cy="19" r="2.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
