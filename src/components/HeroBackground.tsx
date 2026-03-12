import { memo } from "react";

function HeroBackgroundInner() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="nebula1" cx="30%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.05" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebula2" cx="70%" cy="60%" r="40%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.08" />
          <stop offset="60%" stopColor="#4f46e5" stopOpacity="0.03" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebula3" cx="50%" cy="20%" r="35%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebula4" cx="85%" cy="25%" r="30%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.07" />
          <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.02" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nebula5" cx="15%" cy="75%" r="25%">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.05" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>

        {/* Star glow filter */}
        <filter id="starGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Head at 0% (x1,y1), tail fading out toward 100% (x2,y2) */}
        <linearGradient id="shootingStar" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="70%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="shootingStar2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#93c5fd" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="shootingStar3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="75%" stopColor="#c4b5fd" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Nebula layers */}
      <rect width="100%" height="100%" fill="url(#nebula1)" />
      <rect width="100%" height="100%" fill="url(#nebula2)" />
      <rect width="100%" height="100%" fill="url(#nebula3)" />
      <rect width="100%" height="100%" fill="url(#nebula4)" />
      <rect width="100%" height="100%" fill="url(#nebula5)" />

      {/* Grid lines */}
      <g stroke="rgba(255,255,255,0.02)" strokeWidth="0.5">
        <line x1="25%" y1="0" x2="25%" y2="100%" />
        <line x1="50%" y1="0" x2="50%" y2="100%" />
        <line x1="75%" y1="0" x2="75%" y2="100%" />
        <line x1="0" y1="25%" x2="100%" y2="25%" />
        <line x1="0" y1="50%" x2="100%" y2="50%" />
        <line x1="0" y1="75%" x2="100%" y2="75%" />
      </g>

      {/* Constellation paths */}
      <g stroke="rgba(147,197,253,0.08)" strokeWidth="0.5" fill="none">
        <path d="M 15% 20% L 22% 35% L 35% 28% L 28% 15% Z" />
        <path d="M 60% 15% L 72% 25% L 80% 18%" />
        <path d="M 40% 70% L 55% 65% L 50% 80%" />
        <path d="M 75% 55% L 85% 45% L 90% 60%" />
        <path d="M 5% 50% L 12% 42% L 18% 55% L 10% 62%" />
        <path d="M 88% 30% L 95% 22% L 92% 38%" />
      </g>

      {/* Featured bright stars with glow */}
      <g filter="url(#starGlow)">
        <circle cx="12%" cy="18%" r="1.8" fill="white" opacity="0.8" />
        <circle cx="45%" cy="8%" r="1.5" fill="#93c5fd" opacity="0.9" />
        <circle cx="88%" cy="12%" r="1.4" fill="#e0e7ff" opacity="0.7" />
      </g>

      {/* Bright stars */}
      <g>
        <circle cx="72%" cy="78%" r="1.3" fill="white" opacity="0.5" />
        <circle cx="25%" cy="85%" r="1.1" fill="#c4b5fd" opacity="0.6" />
        <circle cx="92%" cy="55%" r="1" fill="white" opacity="0.4" />
        <circle cx="8%" cy="60%" r="0.8" fill="#93c5fd" opacity="0.5" />
        <circle cx="55%" cy="90%" r="1.2" fill="white" opacity="0.3" />
        <circle cx="38%" cy="32%" r="1" fill="#bfdbfe" opacity="0.55" />
        <circle cx="62%" cy="48%" r="0.9" fill="white" opacity="0.45" />
        <circle cx="78%" cy="22%" r="1.1" fill="#ddd6fe" opacity="0.5" />
        <circle cx="15%" cy="42%" r="0.8" fill="white" opacity="0.4" />
        <circle cx="95%" cy="75%" r="1" fill="#93c5fd" opacity="0.35" />
      </g>

      {/* Medium stars */}
      <g opacity="0.4">
        <circle cx="20%" cy="45%" r="0.7" fill="white" />
        <circle cx="35%" cy="15%" r="0.6" fill="white" />
        <circle cx="65%" cy="35%" r="0.5" fill="#bfdbfe" />
        <circle cx="80%" cy="70%" r="0.7" fill="white" />
        <circle cx="50%" cy="55%" r="0.5" fill="white" />
        <circle cx="15%" cy="72%" r="0.6" fill="#ddd6fe" />
        <circle cx="90%" cy="30%" r="0.5" fill="white" />
        <circle cx="42%" cy="42%" r="0.4" fill="white" />
        <circle cx="68%" cy="88%" r="0.6" fill="white" />
        <circle cx="30%" cy="60%" r="0.5" fill="white" />
        <circle cx="3%" cy="35%" r="0.5" fill="#c4b5fd" />
        <circle cx="52%" cy="18%" r="0.6" fill="white" />
        <circle cx="73%" cy="42%" r="0.4" fill="#bfdbfe" />
        <circle cx="28%" cy="28%" r="0.5" fill="white" />
        <circle cx="85%" cy="52%" r="0.6" fill="white" />
        <circle cx="58%" cy="62%" r="0.5" fill="#ddd6fe" />
      </g>

      {/* Small dim stars - scattered densely */}
      <g opacity="0.25">
        <circle cx="5%" cy="10%" r="0.4" fill="white" />
        <circle cx="18%" cy="30%" r="0.3" fill="white" />
        <circle cx="32%" cy="50%" r="0.3" fill="white" />
        <circle cx="48%" cy="25%" r="0.4" fill="white" />
        <circle cx="58%" cy="48%" r="0.3" fill="white" />
        <circle cx="75%" cy="15%" r="0.3" fill="white" />
        <circle cx="82%" cy="85%" r="0.4" fill="white" />
        <circle cx="95%" cy="42%" r="0.3" fill="white" />
        <circle cx="10%" cy="90%" r="0.3" fill="white" />
        <circle cx="62%" cy="72%" r="0.4" fill="white" />
        <circle cx="38%" cy="88%" r="0.3" fill="white" />
        <circle cx="85%" cy="38%" r="0.3" fill="white" />
      </g>
      <g opacity="0.18">
        <circle cx="7%" cy="22%" r="0.3" fill="white" />
        <circle cx="14%" cy="55%" r="0.25" fill="white" />
        <circle cx="22%" cy="68%" r="0.3" fill="white" />
        <circle cx="33%" cy="38%" r="0.25" fill="white" />
        <circle cx="41%" cy="12%" r="0.3" fill="white" />
        <circle cx="47%" cy="82%" r="0.25" fill="white" />
        <circle cx="53%" cy="32%" r="0.3" fill="white" />
        <circle cx="66%" cy="58%" r="0.25" fill="white" />
        <circle cx="71%" cy="8%" r="0.3" fill="white" />
        <circle cx="77%" cy="92%" r="0.25" fill="white" />
        <circle cx="83%" cy="62%" r="0.3" fill="white" />
        <circle cx="91%" cy="18%" r="0.25" fill="white" />
        <circle cx="96%" cy="88%" r="0.3" fill="white" />
        <circle cx="2%" cy="78%" r="0.25" fill="white" />
        <circle cx="27%" cy="5%" r="0.3" fill="white" />
        <circle cx="59%" cy="95%" r="0.25" fill="white" />
      </g>

      {/* Twinkling stars */}
      <g className="hero-twinkle-stars">
        <circle cx="22%" cy="22%" r="1" fill="white" className="hero-twinkle-1" />
        <circle cx="78%" cy="32%" r="0.8" fill="#93c5fd" className="hero-twinkle-2" />
        <circle cx="55%" cy="75%" r="0.9" fill="white" className="hero-twinkle-3" />
        <circle cx="35%" cy="55%" r="0.7" fill="#c4b5fd" className="hero-twinkle-1" />
        <circle cx="85%" cy="65%" r="1" fill="white" className="hero-twinkle-2" />
        <circle cx="10%" cy="38%" r="0.7" fill="#bfdbfe" className="hero-twinkle-3" />
        <circle cx="68%" cy="15%" r="0.8" fill="white" className="hero-twinkle-1" />
        <circle cx="42%" cy="88%" r="0.6" fill="#ddd6fe" className="hero-twinkle-2" />
        <circle cx="92%" cy="45%" r="0.7" fill="white" className="hero-twinkle-3" />
        <circle cx="50%" cy="38%" r="0.6" fill="#93c5fd" className="hero-twinkle-1" />
      </g>

      {/* Pulsing nebula accent */}
      <circle cx="30%" cy="40%" r="80" fill="url(#nebula1)" className="hero-nebula-pulse" opacity="0.4" />

      {/* Orbit ellipses */}
      <g fill="none" strokeWidth="0.5" className="hero-orbits">
        <ellipse cx="50%" cy="50%" rx="30%" ry="20%" stroke="rgba(147,197,253,0.06)" className="hero-orbit-1" />
        <ellipse cx="50%" cy="50%" rx="22%" ry="15%" stroke="rgba(196,181,253,0.04)" className="hero-orbit-2" />
      </g>

      {/* Multiple shooting stars — tail (x2,y2) points opposite to movement direction */}
      <line x1="0" y1="0" x2="65" y2="-25" stroke="url(#shootingStar)" strokeWidth="1.5" strokeLinecap="round" className="hero-shooting-star-1" />
      <line x1="0" y1="0" x2="46" y2="-19" stroke="url(#shootingStar2)" strokeWidth="1" strokeLinecap="round" className="hero-shooting-star-2" />
      <line x1="0" y1="0" x2="35" y2="-20" stroke="url(#shootingStar3)" strokeWidth="0.8" strokeLinecap="round" className="hero-shooting-star-3" />
      <line x1="0" y1="0" x2="31" y2="-45" stroke="url(#shootingStar)" strokeWidth="1.2" strokeLinecap="round" className="hero-shooting-star-4" />
      <line x1="0" y1="0" x2="31" y2="-16" stroke="url(#shootingStar2)" strokeWidth="0.7" strokeLinecap="round" className="hero-shooting-star-5" />
    </svg>
  );
}

const HeroBackground = memo(HeroBackgroundInner);
export default HeroBackground;
