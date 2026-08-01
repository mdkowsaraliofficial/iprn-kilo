import { Hash, MessageSquare, Wallet, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@/lib/router";
import { useStats, useEarnings, useWalletBalance, useLatestOtp, useLatestSms, useNotifications } from "@/hooks/use-api";
import { clearAuth } from "@/lib/api";

function StatCard({ label, value, icon: Icon, loading, glow }: { label: string; value: number | string; icon: typeof Hash; loading: boolean; glow: "cyan" | "purple" | "green" }) {
  return (
    <Card className="glass border-white/20 bg-white/[0.03]">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex size-10 items-center justify-center rounded-lg bg-${glow}/10`}>
          <Icon className={`size-5 text-neon-${glow}`} />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-bold">{value}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: earnings, isLoading: earningsLoading } = useEarnings();
  const { data: wallet, isLoading: walletLoading } = useWalletBalance();
  const { data: otp, isLoading: otpLoading } = useLatestOtp();
  const { data: sms, isLoading: smsLoading } = useLatestSms();
  const notifications = useNotifications(5);
  const recent = notifications.data;

  const fmt = (cents: number) => (cents / 100).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="SMS Today" value={stats?.smsCountToday ?? 0} icon={MessageSquare} loading={statsLoading} glow="cyan" />
        <StatCard label="OTP Today" value={stats?.otpCountToday ?? 0} icon={Hash} loading={statsLoading} glow="purple" />
        <StatCard label="Lifetime Earnings" value={stats ? `$${fmt(stats.lifetimeEarningCents)}` : "—"} icon={Wallet} loading={statsLoading} glow="green" />
        <StatCard label="Earnings Today" value={stats ? `$${fmt(stats.earningsTodayCents)}` : "—"} icon={Clock} loading={statsLoading} glow="green" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass border-white/20">
          <CardHeader><CardTitle>Earnings Overview</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {earningsLoading ? <Skeleton className="h-8 w-40" /> : <p className="text-3xl font-bold">${fmt(earnings?.today ?? 0)}</p>}
            <p className="text-xs text-muted-foreground">
              Today · 7d: ${fmt(earnings?.last7Days ?? 0)} · 30d: ${fmt(earnings?.last30Days ?? 0)} · lifetime: ${fmt(earnings?.lifetime ?? 0)}
            </p>
            <Button variant="link" className="px-0 text-neon-cyan" onClick={() => navigate("/earnings")}>View earnings detail</Button>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardHeader><CardTitle>Withdrawable Balance</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {walletLoading ? <Skeleton className="h-8 w-32" /> : <p className="text-3xl font-bold">${fmt(wallet?.withdrawableCents ?? 0)}</p>}
            <Button variant="link" className="px-0 text-neon-cyan" onClick={() => navigate("/withdrawals")}>Request withdrawal</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass border-white/20">
          <CardHeader><CardTitle>Latest OTP</CardTitle></CardHeader>
          <CardContent>
            {otpLoading ? <Skeleton className="h-6 w-24" /> : <p className="text-2xl font-mono font-bold">{otp?.code ?? "—"}</p>}
          </CardContent>
        </Card>
        <Card className="glass border-white/20">
          <CardHeader><CardTitle>Latest SMS</CardTitle></CardHeader>
          <CardContent>
            {smsLoading ? <Skeleton className="h-6 w-24" /> : <p className="text-sm">{sms?.body ?? "—"}</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Notifications</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/notifications")}>See all</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent notifications</p>
            ) : (
              recent.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded-lg border-white/5 p-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </div>
                  <Badge variant={n.read ? "outline" : "default"}>{n.read ? "Read" : "New"}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Button variant="ghost" size="sm" onClick={() => { clearAuth(); window.location.reload(); }}>
        Switch account / Logout
      </Button>
    </div>
  );
}

export default DashboardPage;
