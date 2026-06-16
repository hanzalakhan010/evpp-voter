import React, { useMemo } from "react";

interface ConfettiProps {
  count?: number;
}

const COLORS = ["#1d4ed8", "#fbbf24", "#ef4444", "#10b981", "#0b1220", "#f97316"];

const Confetti: React.FC<ConfettiProps> = ({ count = 80 }) => {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 2.5 + Math.random() * 2,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * 360,
      })),
    [count]
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-dot confetti-fall"
          style={{
            left: p.left + "%",
            top: -30,
            background: p.color,
            animationDelay: p.delay + "s",
            animationDuration: p.dur + "s",
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
