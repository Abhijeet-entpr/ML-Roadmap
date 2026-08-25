import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  className?: string
}

export default function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className={cn('relative inline-flex flex-col items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label ?? `${clamped}% complete`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="text-primary transition-all duration-700 ease-out"
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-foreground text-xl font-semibold"
          fontSize={size * 0.18}
        >
          {clamped}%
        </text>
      </svg>
      {label ? <span className="text-sm font-medium">{label}</span> : null}
      {sublabel ? <span className="text-xs text-muted-foreground">{sublabel}</span> : null}
    </div>
  )
}
