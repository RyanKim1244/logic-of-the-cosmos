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
      {/* Center dot */}
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
    </svg>
  );
}
