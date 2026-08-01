import { useEffect, useRef, type ComponentType } from "react"
import { motion, useMotionValue, useSpring, animate } from "framer-motion"
import { ArrowUp, ArrowDown, type LucideProps } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type GlowColor = "cyan" | "purple" | "green" | "amber" | "pink"

const glowMap: Record<GlowColor, string> = {
  cyan: "neon-glow-cyan",
  purple: "neon-glow-purple",
  green: "neon-glow-green",
  amber: "neon-glow-amber",
  pink: "neon-glow-pink",
}

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

type StatsCardProps = {
  label: string
  value: number
  icon: ComponentType<LucideProps>
  glowColor?: GlowColor
  trend?: number
  prefix?: string
  suffix?: string
  loading?: boolean
  delay?: number
  index?: number
}

function CountUp({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: 1500, bounce: 0 })

  useEffect(() => {
    animate(motionValue, value, { duration: 1.5, ease: "easeOut" })
  }, [value, motionValue])

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.round(latest).toLocaleString()}${suffix}`
      }
    })
  }, [spring, prefix, suffix])

  return <span ref={ref}>{prefix}0{suffix}</span>
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  glowColor = "cyan",
  trend,
  prefix = "",
  suffix = "",
  loading = false,
  delay = 0,
}: StatsCardProps) {
  const hasTrend = trend !== undefined
  const isPositive = (trend ?? 0) >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "glass relative overflow-hidden rounded-2xl border-white/20 p-5 transition-shadow duration-300",
        `hover:${glowMap[glowColor]}`
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-9 w-24 bg-white/5" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">
              <CountUp value={value} prefix={prefix} suffix={suffix} />
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
    </motion.div>
  )
}
