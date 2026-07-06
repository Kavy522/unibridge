import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#2563EB', '#7C3AED', '#0891B2', '#16A34A', '#D97706', '#DC2626', '#EA580C']
const axis = { fontSize: 11, fill: '#94A3B8' }
const gridStroke = '#E2E8F0'

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}

/** Single-series area/line trend (e.g. attendance over months). */
export function TrendAreaChart({
  labels = [],
  data = [],
  height = 240,
  color = '#2563EB',
}: {
  labels?: string[]
  data?: number[]
  height?: number
  color?: string
}) {
  const chartData = (labels ?? []).map((label, i) => ({ label, value: (data ?? [])[i] ?? null }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#trendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Multi-series line chart (e.g. attendance trend per batch). */
export function MultiLineChart({
  labels = [],
  series = [],
  height = 260,
}: {
  labels?: string[]
  series?: { name: string; data: (number | null)[] }[]
  height?: number
}) {
  const chartData = (labels ?? []).map((label, i) => {
    const row: Record<string, number | string | null> = { label }
    ;(series ?? []).forEach((s) => (row[s.name] = s.data?.[i] ?? null))
    return row
  })
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

/** Simple vertical bar chart from {label,value} pairs. */
export function SimpleBarChart({
  data = [],
  height = 240,
  color = '#2563EB',
  domainMax = 100,
}: {
  data?: { label: string; value: number | null }[]
  height?: number
  color?: string
  domainMax?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} domain={[0, domainMax]} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Donut/pie chart from {label,value} pairs. */
export function DonutChart({
  data = [],
  height = 240,
}: {
  data?: { label: string; value: number }[]
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data ?? []}
          dataKey="value"
          nameKey="label"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

/** Radar comparing two series across subjects. */
export function RadarCompareChart({
  subjects = [],
  topAvg = [],
  bottomAvg = [],
  height = 300,
}: {
  subjects?: string[]
  topAvg?: number[]
  bottomAvg?: number[]
  height?: number
}) {
  const data = (subjects ?? []).map((s, i) => ({ subject: s, Top: (topAvg ?? [])[i], Bottom: (bottomAvg ?? [])[i] }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke={gridStroke} />
        <PolarAngleAxis dataKey="subject" tick={axis} />
        <Radar name="Top 10" dataKey="Top" stroke="#16A34A" fill="#16A34A" fillOpacity={0.25} />
        <Radar name="Bottom 10" dataKey="Bottom" stroke="#DC2626" fill="#DC2626" fillOpacity={0.2} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export { COLORS as CHART_COLORS }
