export default function ProgressBar({
  value,
  color = "var(--terracotta)",
  className = "",
}: {
  /** 0–100 */
  value: number;
  color?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-ink/10 ${className}`}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
