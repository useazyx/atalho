import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatDay, formatDayLong, formatNumber } from "../../lib/format"
import type { DailyClicks } from "../../lib/types"
import { useThemeColors } from "../../lib/useThemeColors"
import { ChartTooltip } from "./ChartTooltip"

// Cliques e visitantes únicos no mesmo eixo (mesma unidade: gente). Área clarinha só embaixo dos cliques.
export function ClicksChart({ daily }: { daily: DailyClicks[] }) {
  const colors = useThemeColors()

  const series = [
    { key: "clicks" as const, name: "Cliques", color: colors.series1 },
    { key: "unique_visitors" as const, name: "Visitantes únicos", color: colors.series2 },
  ]

  const activeDot = (color: string) => ({ r: 4, fill: color, stroke: colors.surface, strokeWidth: 2 })

  return (
    <div>
      {/* Duas séries: a legenda sempre aparece (a cor sozinha não identifica nada) */}
      <ul className="mb-3 flex flex-wrap gap-4 text-sm text-ink-secondary">
        {series.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: item.color }} />
            {item.name}
          </li>
        ))}
      </ul>

      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} strokeWidth={1} />
            <XAxis
              dataKey="date"
              tickFormatter={(day) => formatDay(String(day))}
              minTickGap={32}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={{ stroke: colors.grid }}
              tick={{ fill: colors.inkMuted, fontSize: 12 }}
            />
            <YAxis
              width={40}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatNumber(Number(value))}
              tick={{ fill: colors.inkMuted, fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: colors.inkMuted, strokeWidth: 1 }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as DailyClicks | undefined
                if (!active || !row) return null
                return (
                  <ChartTooltip
                    title={formatDayLong(row.date)}
                    rows={series.map((item) => ({ color: item.color, name: item.name, value: formatNumber(row[item.key]) }))}
                  />
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              name="Cliques"
              stroke={colors.series1}
              strokeWidth={2}
              fill={colors.series1}
              fillOpacity={0.1}
              dot={false}
              activeDot={activeDot(colors.series1)}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="unique_visitors"
              name="Visitantes únicos"
              stroke={colors.series2}
              strokeWidth={2}
              dot={false}
              activeDot={activeDot(colors.series2)}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* A mesma informação em tabela, pra leitor de tela. O sr-only fica numa div: tabela ignora width 1px
          e, com 90 linhas, empurrava a página pro lado no celular */}
      <div className="sr-only">
        <table>
          <caption>Cliques e visitantes únicos por dia</caption>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col">Cliques</th>
              <th scope="col">Visitantes únicos</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((day) => (
              <tr key={day.date}>
                <td>{formatDayLong(day.date)}</td>
                <td>{day.clicks}</td>
                <td>{day.unique_visitors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
