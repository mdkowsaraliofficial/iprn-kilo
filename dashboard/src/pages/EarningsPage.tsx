import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useEarnings, useEarningsByDay } from "@/hooks/use-api";

export function EarningsPage() {
  const { data: earnings, isLoading } = useEarnings();
  const chart = useEarningsByDay();
  const data = chart.data ?? [];
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Earnings</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="glass border-white/20">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Today</p>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold">{fmt(earnings?.today ?? 0)}</p>}
          </CardContent>
        </Card>
        <Card className="glass border-white/20">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Yesterday</p>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold">{fmt(earnings?.yesterday ?? 0)}</p>}
          </CardContent>
        </Card>
        <Card className="glass border-white/20">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Last 7 days</p>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold">{fmt(earnings?.last7Days ?? 0)}</p>}
          </CardContent>
        </Card>
        <Card className="glass border-white/20">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Last 30 days</p>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold">{fmt(earnings?.last30Days ?? 0)}</p>}
          </CardContent>
        </Card>
        <Card className="glass border-white/20">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Lifetime</p>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold">{fmt(earnings?.lifetime ?? 0)}</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Earnings by Day</CardTitle></CardHeader>
        <CardContent>
          {chart.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="earningsCents" stroke="var(--neon-purple)" strokeWidth={2} fill="url(#earn-grad)" fillOpacity={1} />
                <defs>
                  <linearGradient id="earn-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--neon-purple)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--neon-purple)" stopOpacity={0} />
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
