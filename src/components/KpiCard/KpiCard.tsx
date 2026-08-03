import './KpiCard.css';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface KpiCardProps {
  /** Card title, e.g. "Vendas" */
  title: string;
  /** Current achieved value (formatted string, e.g. "R$ 1.245.890") */
  currentValue: string;
  /** Target / goal label (e.g. "R$ 1.500.000" or "cobertura") */
  targetValue: string;
  /** Completion percentage (0–100) */
  percentage: number;
  /** Emoji icon displayed on the card */
  icon: string;
  /** Trend direction for the indicator arrow */
  trend: 'up' | 'down' | 'neutral';
  /** Accent color applied as top-border and progress bar (optional) */
  color?: string;
  /** Animation stagger index for grid entrance effect */
  index?: number;
  /** A label to show the gap (e.g., Faltam X ou Superamos Y) */
  gapLabel?: string | React.ReactNode;
  /** Gap color (usually red for missing, green for surpassed) */
  gapColor?: 'red' | 'green';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function KpiCard({
  title,
  currentValue,
  targetValue,
  percentage,
  icon,
  trend,
  color = '#00e887',
  index = 0,
  gapLabel,
  gapColor
}: KpiCardProps) {
  /** Trend arrow symbol */
  const trendIcon =
    trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●';

  return (
    <article
      className="kpi-card"
      style={
        {
          '--kpi-accent': color,
          '--kpi-stagger': `${index * 80}ms`,
        } as React.CSSProperties
      }
    >
      {/* Top accent bar */}
      <div className="kpi-card__accent" />

      {/* Header row: icon + title + trend */}
      <div className="kpi-card__header">
        <span className="kpi-card__icon">{icon}</span>
        <h3 className="kpi-card__title">{title}</h3>
        <span className={`kpi-card__trend kpi-card__trend--${trend}`}>
          {trendIcon}
        </span>
      </div>

      {/* Value display */}
      <div className="kpi-card__values">
        <span className="kpi-card__current">{currentValue}</span>
        <span className="kpi-card__separator"> / </span>
        <span className="kpi-card__target">{targetValue}</span>
      </div>

      {/* Progress bar */}
      <div className="kpi-card__progress-track">
        <div
          className="kpi-card__progress-fill"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Percentage label and Gap */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <span className="kpi-card__percentage" style={{ marginTop: 0 }}>
          {percentage.toFixed(1)}%
        </span>
        
        {gapLabel && (
          <span style={{ 
            fontSize: '0.85rem', 
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: gapColor === 'red' ? '#ef444420' : '#10b98120',
            color: gapColor === 'red' ? '#ef4444' : '#10b981'
          }}>
            {gapLabel}
          </span>
        )}
      </div>
    </article>
  );
}
