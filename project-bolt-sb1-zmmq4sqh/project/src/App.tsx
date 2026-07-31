import { Hash, MessageSquare, Mic, DollarSign, Calendar, CalendarDays } from "lucide-react"

import { Header } from "@/components/layout/header"
import { FloatingNavBar } from "@/components/layout/floating-nav-bar"
import { StatsCard } from "@/components/dashboard/stats-card"
import { EarningsCard } from "@/components/dashboard/earnings-card"
import { WithdrawalModule } from "@/components/withdrawal/withdrawal-module"
import { WithdrawalHistory } from "@/components/withdrawal/withdrawal-history"
import { Toaster } from "@/components/ui/sonner"
import { useStats, useEarnings } from "@/hooks/use-api"

function App() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: earnings, isLoading: earningsLoading } = useEarnings()

  return (
    <div className="relative min-h-svh bg-background bg-grid">
      {/* Ambient glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-neon-cyan/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 size-96 rounded-full bg-neon-purple/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-neon-green/5 blur-[100px]" />
      </div>

      <Header />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6">
        {/* Row 1 — Number Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            label="Total Numbers"
            value={stats?.totalNumbers ?? 0}
            icon={Hash}
            glowColor="cyan"
            loading={statsLoading}
            delay={0}
          />
          <StatsCard
            label="Total SMS Received"
            value={stats?.totalSms ?? 0}
            icon={MessageSquare}
            glowColor="purple"
            loading={statsLoading}
            delay={0.1}
          />
          <StatsCard
            label="Total Voice Calls"
            value={stats?.totalVoice ?? 0}
            icon={Mic}
            glowColor="green"
            loading={statsLoading}
            delay={0.2}
          />
        </div>

        {/* Row 2 — Earnings Cards */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <EarningsCard
            label="Yesterday's Earnings"
            value={earnings?.yesterday ?? 0}
            icon={DollarSign}
            glowColor="cyan"
            trend={earnings?.yesterdayTrend}
            loading={earningsLoading}
            delay={0.15}
            chartData={earnings?.hourlyData.map((d) => ({ label: d.hour, amount: d.amount })) ?? []}
          />
          <EarningsCard
            label="Last 7 Days"
            value={earnings?.sevenDay ?? 0}
            icon={Calendar}
            glowColor="purple"
            trend={earnings?.sevenDayTrend}
            loading={earningsLoading}
            delay={0.25}
            chartData={earnings?.sevenDayData.map((d) => ({ label: d.day, amount: d.amount })) ?? []}
          />
          <EarningsCard
            label="Last 30 Days"
            value={earnings?.thirtyDay ?? 0}
            icon={CalendarDays}
            glowColor="amber"
            trend={earnings?.thirtyDayTrend}
            loading={earningsLoading}
            delay={0.35}
            chartData={earnings?.thirtyDayData.map((d) => ({ label: d.day, amount: d.amount })) ?? []}
          />
        </div>

        {/* Financial Section — Withdrawal Module */}
        <div className="mt-8">
          <WithdrawalModule />
        </div>

        {/* Withdrawal History */}
        <div className="mt-4">
          <WithdrawalHistory />
        </div>
      </main>

      <FloatingNavBar />
      <Toaster />
    </div>
  )
}

export default App
