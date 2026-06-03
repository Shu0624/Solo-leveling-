import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Users, Clock, Trophy, Star, Flame, Activity,
  TrendingUp, TrendingDown, FileText, BarChart3
} from 'lucide-react';

// =====================================================================
// THEME COLORS — works with both light/dark mode
// =====================================================================
const CHART_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#f43f5e',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
  '#14b8a6', '#e11d48',
];

// =====================================================================
// METRIC CARD
// =====================================================================
export const MetricCard = ({ label, value, icon, color, trend, delay = 0 }) => {
  const iconMap = {
    users: Users, clock: Clock, trophy: Trophy, star: Star, flame: Flame,
    activity: Activity, file: FileText, chart: BarChart3,
  };
  const Icon = iconMap[icon] || Activity;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className="glass-morphism p-6 flex flex-col items-center text-center group hover:scale-[1.02] transition-transform"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon size={24} />
      </div>
      <div className="text-3xl font-black text-foreground mb-1">{value}</div>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</div>
      {trend !== undefined && (
        <div className={`text-xs font-medium mt-2 flex items-center gap-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}% vs last period
        </div>
      )}
    </motion.div>
  );
};

// =====================================================================
// TREND LINE CHART
// =====================================================================
export const TrendLineChart = ({ data, dataKeys = ['hours'], xAxisKey = 'date', title, colors = CHART_COLORS, height = 300 }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-morphism p-6">
      {title && <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            {dataKeys.map((key, i) => (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickFormatter={v => v.length > 5 ? v.slice(5) : v}
          />
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Legend />
          {dataKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              fill={`url(#gradient-${key})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// =====================================================================
// COMPARISON BAR CHART
// =====================================================================
export const ComparisonBarChart = ({ data, dataKeys = ['value'], xAxisKey = 'name', title, colors = CHART_COLORS, height = 300 }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-morphism p-6">
      {title && <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xAxisKey} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Legend />
          {dataKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[i % colors.length]}
              radius={[6, 6, 0, 0]}
              animationDuration={800}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// =====================================================================
// CATEGORY PIE CHART
// =====================================================================
export const CategoryPieChart = ({ data, dataKey = 'hours', nameKey = 'name', title, colors = CHART_COLORS, height = 300 }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-morphism p-6">
      {title && <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            animationDuration={800}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={colors[i % colors.length]}
                opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                style={{ transition: 'opacity 0.2s' }}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// =====================================================================
// PERFORMANCE RADAR CHART
// =====================================================================
export const PerformanceRadarChart = ({ data, dataKeys = ['value'], title, colors = CHART_COLORS, height = 300 }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-morphism p-6">
      {title && <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          />
          <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
          {dataKeys.map((key, i) => (
            <Radar
              key={key}
              name={key}
              dataKey={key}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.15}
              animationDuration={800}
            />
          ))}
          <Legend />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              color: 'hsl(var(--foreground))',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// =====================================================================
// STUDY HEATMAP (simplified grid)
// =====================================================================
export const StudyHeatmap = ({ data, title, height = 200 }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxVal = Math.max(...data.map(d => d.hours || 0), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-morphism p-6">
      {title && <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>}
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => (
          <div key={day} className="text-center text-xs font-bold text-muted-foreground uppercase mb-2">{day}</div>
        ))}
        {data.map((d, i) => {
          const intensity = (d.hours || 0) / maxVal;
          return (
            <div
              key={i}
              className="aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all hover:scale-110"
              style={{
                backgroundColor: `rgba(99, 102, 241, ${0.05 + intensity * 0.85})`,
                color: intensity > 0.5 ? '#fff' : 'hsl(var(--muted-foreground))',
              }}
              title={`${d.label || days[i % 7]}: ${d.hours || 0}h`}
            >
              {d.hours ? `${d.hours}h` : '-'}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// =====================================================================
// DATA TABLE
// =====================================================================
export const DataTable = ({ columns, data, title }) => {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const sorted = sortCol
    ? [...data].sort((a, b) => {
        let va = a[sortCol], vb = b[sortCol];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  const getLabel = (col) => {
    return col.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-morphism p-6 overflow-x-auto">
      {title && <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(col => (
              <th
                key={col}
                className="text-left py-3 px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort(col)}
              >
                {getLabel(col)} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
            >
              {columns.map(col => (
                <td key={col} className="py-3 px-3 font-medium text-foreground">
                  {col === 'riskLevel' ? (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      row[col] === 'HIGH' ? 'bg-destructive/10 text-destructive' :
                      row[col] === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                      'bg-success/10 text-success'
                    }`}>
                      {row[col]}
                    </span>
                  ) : col === 'name' && row.id ? (
                    <Link
                      to={`/my-analytics?studentId=${row.id}`}
                      className="text-primary hover:underline hover:text-primary/80 font-bold transition-colors"
                    >
                      {row[col]}
                    </Link>
                  ) : (
                    row[col]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No data available</div>
      )}
    </motion.div>
  );
};

// =====================================================================
// DYNAMIC QUERY RESULT RENDERER
// =====================================================================
export const QueryResultRenderer = ({ result }) => {
  if (!result) return null;

  switch (result.type) {
    case 'chart':
      switch (result.chartType) {
        case 'line':
          return <TrendLineChart data={result.data} dataKeys={result.dataKeys} xAxisKey={result.xAxisKey} title={result.title} colors={result.colors} />;
        case 'bar':
          return <ComparisonBarChart data={result.data} dataKeys={result.dataKeys} xAxisKey={result.xAxisKey} title={result.title} colors={result.colors} />;
        case 'pie':
          return <CategoryPieChart data={result.data} dataKey={result.dataKeys?.[0]} nameKey={result.nameKey || 'name'} title={result.title} colors={result.colors} />;
        case 'radar': {
          // Transform for radar
          if (result.data.length > 0) {
            const metrics = result.dataKeys || [];
            const radarData = metrics.map(metric => {
              const point = { metric };
              result.data.forEach(d => {
                point[d.classroom || d.name || 'value'] = d[metric] || 0;
              });
              return point;
            });
            const radarKeys = result.data.map(d => d.classroom || d.name || 'value');
            return <PerformanceRadarChart data={radarData} dataKeys={radarKeys} title={result.title} colors={result.colors} />;
          }
          return null;
        }
        default:
          return <ComparisonBarChart data={result.data} dataKeys={result.dataKeys} xAxisKey={result.xAxisKey} title={result.title} />;
      }

    case 'table':
      return <DataTable columns={result.columns} data={result.data} title={result.title} />;

    case 'stats':
      return (
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4">{result.title}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {result.data.map((stat, i) => (
              <MetricCard key={i} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} delay={i} />
            ))}
          </div>
        </div>
      );

    case 'text':
    default:
      return (
        <div className="glass-morphism p-6">
          <h3 className="text-lg font-bold text-foreground mb-2">{result.title}</h3>
          <p className="text-muted-foreground">{result.summary}</p>
        </div>
      );
  }
};
