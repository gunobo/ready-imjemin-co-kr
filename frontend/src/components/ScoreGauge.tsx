import { useCountUp } from "../hooks/useCountUp";

const SIZE = 104;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreGauge({ value, max, color }: { value: number; max: number; color: string }) {
  const animated = useCountUp(value);
  const pct = max > 0 ? Math.min(1, animated / max) : 0;
  const offset = CIRCUMFERENCE * (1 - pct);

  return (
    <div className="gauge">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle className="gauge-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} />
        <circle
          className="gauge-fill"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-center">
        <span className="num">{animated.toFixed(1)}</span>
        <span className="pct">{Math.round(pct * 100)}%</span>
      </div>
    </div>
  );
}
