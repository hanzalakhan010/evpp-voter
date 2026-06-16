import React from "react";

interface MascotProps {
  size?: number;
  mood?: "happy" | "cheer";
  waving?: boolean;
}

const Mascot: React.FC<MascotProps> = ({ size = 44, mood = "happy", waving = false }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" className={waving ? "wig" : ""}>
    <ellipse cx="30" cy="36" rx="20" ry="18" fill="#dbeafe" stroke="#0b1220" strokeWidth="2.2" />
    <ellipse cx="30" cy="40" rx="11" ry="10" fill="#fafaf6" stroke="#0b1220" strokeWidth="1.4" />
    <circle cx="23" cy="28" r="3.4" fill="#fafaf6" stroke="#0b1220" strokeWidth="1.6" />
    <circle cx="37" cy="28" r="3.4" fill="#fafaf6" stroke="#0b1220" strokeWidth="1.6" />
    <circle cx="23.8" cy="28.6" r="1.5" fill="#0b1220" />
    <circle cx="37.8" cy="28.6" r="1.5" fill="#0b1220" />
    <path d="M27 33 Q30 36 33 33 Q30 35.5 27 33Z" fill="#fbbf24" stroke="#0b1220" strokeWidth="1.4" />
    <path d="M28 16 Q30 11 32 16" fill="none" stroke="#0b1220" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M24 53 l0 3 M24 56 l-2 0 M24 56 l2 0" stroke="#0b1220" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <path d="M36 53 l0 3 M36 56 l-2 0 M36 56 l2 0" stroke="#0b1220" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    {mood === "cheer" && (
      <path d="M25 31 Q30 36 35 31" stroke="#0b1220" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    )}
    {waving && (
      <path d="M48 32 Q54 24 50 18" stroke="#0b1220" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    )}
  </svg>
);

export default Mascot;
