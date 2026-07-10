// Shared recharts theming so every chart reads as one system.
// Colors reference the CSS token variables via hsl() so they follow the theme.

const cssVar = (name, alpha) => {
  if (typeof window === 'undefined') return `hsl(var(${name}))`;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return alpha != null ? `hsl(${v} / ${alpha})` : `hsl(${v})`;
};

// Categorical series palette — brand-anchored, works in both themes.
export const CHART_COLORS = [
  'hsl(199 89% 48%)', // cyan (primary)
  'hsl(262 83% 62%)', // violet (accent)
  'hsl(142 68% 45%)', // green
  'hsl(38 92% 52%)',  // amber
  'hsl(199 89% 68%)', // light cyan
  'hsl(330 75% 60%)', // pink
];

export const chartColor = (i) => CHART_COLORS[i % CHART_COLORS.length];

// Read live theme colors (call inside a component so it re-reads on theme change).
export const getChartTheme = () => ({
  grid: cssVar('--border'),
  axis: cssVar('--muted-foreground'),
  text: cssVar('--muted-foreground'),
});

// Spread onto a recharts <Tooltip contentStyle=...> or use the component below.
export const tooltipStyle = () => ({
  background: cssVar('--popover'),
  border: `1px solid ${cssVar('--border')}`,
  borderRadius: '0.75rem',
  boxShadow: 'var(--shadow-md)',
  color: cssVar('--popover-foreground'),
  fontSize: '12px',
  padding: '8px 12px',
});

export const axisProps = () => ({
  stroke: cssVar('--border'),
  tick: { fill: cssVar('--muted-foreground'), fontSize: 11 },
  tickLine: false,
  axisLine: false,
});

// <defs> gradient id helpers for area/bar fills.
export const GRADIENT_IDS = { primary: 'grad-primary', accent: 'grad-accent' };
