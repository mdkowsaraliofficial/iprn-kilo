import { BarChart3, Globe, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { CountryOperatorSummary, AnalyticsByDay } from "@iprn/types";

function StatCard({ label, value, icon: Icon, loading }: { label: string; value: number | string; icon: typeof BarChart3; loading: boolean }) {
  return (
    <Card className="glass border-white/20">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-neon-cyan/10">
          <Icon className="size-5 text-neon-cyan" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold">{value}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsPage() {
  const summary = useSWR("/v1/analytics/summary", () => apiClient.analyticsSummary(), adminSwr);
  const byCountry = useSWR<CountryOperatorSummary[]>("/v1/analytics/sms-by-country", () => apiClient.analyticsByCountry({}), adminSwr);
  const byDay = useSWR<AnalyticsByDay[]>("/v1/analytics/earnings-by-day", () => apiClient.analyticsEarningsByDay({}), adminSwr);
  const fmt = (c: number) => (c / 100).toFixed(2);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics Intelligence</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="SMS Today" value={summary.data?.smsCountToday ?? 0} icon={BarChart3} loading={summary.isLoading} />
        <StatCard label="OTP Today" value={summary.data?.otpCountToday ?? 0} icon={BarChart3} loading={summary.isLoading} />
        <StatCard label="Earnings Today" value={summary.data ? `$${fmt(summary.data.earningsTodayCents)}` : "—"} icon={TrendingUp} loading={summary.isLoading} />
        <StatCard label="Lifetime" value={summary.data ? `$${fmt(summary.data.lifetimeEarningCents)}` : "—"} icon={Globe} loading={summary.isLoading} />
      </div>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Earnings by Day</CardTitle></CardHeader>
        <CardContent>
          {byDay.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDay.data ?? []}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="earningsCents" fill="var(--neon-purple)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>SMS by Country</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader><TableRow><TableHead>Country</TableHead><TableHead className="text-right">Available</TableHead><TableHead className="text-right">Assigned</TableHead></TableRow></TableHeader>
              <TableBody>
                {(byCountry.data ?? []).map((c) => (
                  <TableRow key={c.countryCode}>
                    <TableCell>{c.countryName}</TableCell>
                    <TableCell className="text-right">{c.available}</TableCell>
                    <TableCell className="text-right">{c.assigned}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsPage;
