import { Hash, TrendingUp, Smartphone, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useStats, useEarningsByDay } from "@/hooks/use-api";

function StatRow({ label, value, icon: Icon, loading }: { label: string; value: number | string; icon: typeof Hash; loading: boolean }) {
  return (
    <TableRow>
      <TableCell className="flex items-center gap-2 font-medium">
        <Icon className="size-4 text-neon-cyan" />
        {label}
      </TableCell>
      <TableCell className="text-right">{loading ? <Skeleton className="h-5 w-16" /> : <span className="font-mono">{value}</span>}</TableCell>
    </TableRow>
  );
}

export function StatsPage() {
  const { data: stats, isLoading } = useStats();
  const earningsChart = useEarningsByDay();
  const chartData = earningsChart.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stats & Analytics</h1>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Platform Summary</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <StatRow label="SMS Today" value={stats?.smsCountToday ?? 0} icon={Smartphone} loading={isLoading} />
              <StatRow label="OTP Today" value={stats?.otpCountToday ?? 0} icon={Hash} loading={isLoading} />
              <StatRow label="Earnings Today" value={stats ? `$${(stats.earningsTodayCents / 100).toFixed(2)}` : "—"} icon={DollarSign} loading={isLoading} />
              <StatRow label="Earnings 7d" value={stats ? `$${(stats.earnings7dCents / 100).toFixed(2)}` : "—"} icon={TrendingUp} loading={isLoading} />
              <StatRow label="Earnings 30d" value={stats ? `$${(stats.earnings30dCents / 100).toFixed(2)}` : "—"} icon={TrendingUp} loading={isLoading} />
              <StatRow label="Lifetime Earnings" value={stats ? `$${(stats.lifetimeEarningCents / 100).toFixed(2)}` : "—"} icon={DollarSign} loading={false} />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Earnings by Day</CardTitle></CardHeader>
        <CardContent>
          {earningsChart.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="earningsCents" stroke="var(--neon-cyan)" strokeWidth={2} fill="url(#earn-grad)" fillOpacity={1} />
                <defs>
                  <linearGradient id="earn-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
