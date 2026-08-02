import { useEffect, useRef, useState, type ComponentType } from "react"
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion"
import { ArrowUp, ArrowDown, ChevronDown, type LucideProps } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type GlowColor = "cyan" | "purple" | "green" | "amber" | "pink"

const textMap: Record<GlowColor, string> = {
  cyan: "text-neon-cyan",
  purple: "text-neon-purple",
  green: "text-neon-green",
  amber: "text-neon-amber",
  pink: "text-neon-pink",
}

const bgMap: Record<GlowColor, string> = {
  cyan: "bg-neon-cyan/10",
  purple: "bg-neon-purple/10",
  green: "bg-neon-green/10",
  amber: "bg-neon-amber/10",
  pink: "bg-neon-pink/10",
}

const strokeMap: Record<GlowColor, string> = {
  cyan: "var(--neon-cyan)",
  purple: "var(--neon-purple)",
  green: "var(--neon-green)",
  amber: "var(--neon-amber)",
  pink: "var(--neon-pink)",
}

const glowHoverMap: Record<GlowColor, string> = {
  cyan: "hover:neon-glow-cyan",
  purple: "hover:neon-glow-purple",
  green: "hover:neon-glow-green",
  amber: "hover:neon-glow-amber",
  pink: "hover:neon-glow-pink",
}

type EarningsCardProps = {
  label: string
  value: number
  icon: ComponentType<LucideProps>
  glowColor?: GlowColor
  trend?: number
  loading?: boolean
  delay?: number
  chartData?: { label: string; amount: number }[]
  chartDataKey?: string
}

function CountUp({ value, prefix = "" }: { value: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.5, ease: "easeOut" })
    return controls.stop
  }, [value, motionValue])

  useEffect(() => {
    return motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }
    })
  }, [motionValue, prefix])

  return <span ref={ref}>{prefix}0.00</span>
}

export function EarningsCard({
  label,
  value,
  icon: Icon,
  glowColor = "cyan",
  trend,
  loading = false,
  delay = 0,
  chartData = [],
  chartDataKey = "amount",
}: EarningsCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasTrend = trend !== undefined
  const isPositive = (trend ?? 0) >= 0

  const chartConfig: ChartConfig = {
    [chartDataKey]: {
      label: label,
      color: strokeMap[glowColor],
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "glass relative overflow-hidden rounded-2xl border-white/20 p-5 transition-shadow duration-300",
        glowHoverMap[glowColor]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-9 w-28 bg-white/5" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">
              <CountUp value={value} prefix="$" />
            </p>
          )}
        </div>
        <div className={cn("flex size-10 items-center justify-center rounded-xl", bgMap[glowColor])}>
          <Icon className={cn("size-5", textMap[glowColor])} />
        </div>
      </div>
      {hasTrend && !loading && (
        <div className="mt-3 flex items-center gap-1.5">
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
              isPositive ? "bg-neon-green/10 text-neon-green" : "bg-destructive/10 text-destructive"
            )}
          >
            {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {Math.abs(trend!)}%
          </div>
          <span className="text-xs text-muted-foreground">vs previous period</span>
        </div>
      )}
      {chartData.length > 0 && !loading && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={expanded}
            aria-label={expanded ? "Hide details" : "Show details"}
          >
            {expanded ? "Hide Details" : "Show Details"}
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown className="size-3" />
            </motion.span>
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3">
                  <ChartContainer config={chartConfig} className="h-[140px] w-full">
                    <AreaChart data={chartData} accessibilityLayer>
                      <defs>
                        <linearGradient id={`gradient-${glowColor}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={strokeMap[glowColor]} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={strokeMap[glowColor]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey={chartDataKey}
                        stroke={strokeMap[glowColor]}
                        strokeWidth={2}
                        fill={`url(#gradient-${glowColor})`}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  )
}
