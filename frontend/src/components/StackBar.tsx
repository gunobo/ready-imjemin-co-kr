export interface StackSegment {
  label: string;
  value: number;
  color: string;
}

export function StackBar({ segments }: { segments: StackSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <div>
      <div className="stack-bar">
        {segments.map((s) => (
          <span key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="legend">
        {segments.map((s) => (
          <span className="legend-item" key={s.label}>
            <span className="legend-dot" style={{ background: s.color }} />
            {s.label} {s.value}
          </span>
        ))}
      </div>
    </div>
  );
}
