import { Users, Hash, Smartphone, Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { AdminStats, HealthStatus, HealthComponent } from "@iprn/types";

function StatCard({ label, value, icon: Icon, loading }: { label: string; value: number | string; icon: typeof Users; loading: boolean }) {
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

export function AdminDashboard() {
  const stats = useSWR<AdminStats>("/v1/admin/stats", () => apiClient.admin.systemStats(), adminSwr);
  const health = useSWR<HealthStatus>("/v1/public/health", () => apiClient.health(), adminSwr);
  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Users" value={stats.data?.totalUsers ?? 0} icon={Users} loading={stats.isLoading} />
        <StatCard label="Numbers" value={stats.data?.totalNumbers ?? 0} icon={Hash} loading={stats.isLoading} />
        <StatCard label="SMS" value={stats.data?.totalSms ?? 0} icon={Smartphone} loading={stats.isLoading} />
        <StatCard label="OTP" value={stats.data?.totalOtp ?? 0} icon={Smartphone} loading={stats.isLoading} />
        <StatCard label="Earnings" value={stats.data ? fmt(stats.data.totalEarningsCents) : "—"} icon={Wallet} loading={stats.isLoading} />
        <StatCard label="Rewards" value={stats.data ? fmt(stats.data.totalRewardsCents) : "—"} icon={TrendingUp} loading={stats.isLoading} />
      </div>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
        <CardContent>
          {health.isLoading ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                Status: <Badge variant={health.data?.status === "healthy" ? "default" : "destructive"}>{health.data?.status ?? "unknown"}</Badge>
              </p>
              <p className="text-xs text-muted-foreground">Version: {health.data?.version ?? "—"}</p>
              <div className="pt-2">
                {(health.data?.components ?? []).map((c: HealthComponent) => (
                  <div key={c.name} className="flex items-center justify-between py-1">
                    <span className="text-sm">{c.name}</span>
                    <Badge variant={c.status === "healthy" ? "default" : c.status === "degraded" ? "secondary" : "destructive"}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboard;
