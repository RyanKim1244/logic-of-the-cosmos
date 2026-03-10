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
      {/* C shape - open arc representing cosmos/infinity */}
      <path
        d="M72 20A42 42 0 1 0 72 80"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Orbital ring - tilted ellipse through the C opening */}
      <ellipse
        cx="50"
        cy="50"
        rx="18"
        ry="42"
        transform="rotate(-30 50 50)"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="4 6"
        fill="none"
        opacity="0.5"
      />
      {/* Star/dot at center */}
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
      {/* Small orbiting dot */}
      <circle cx="72" cy="22" r="2.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
