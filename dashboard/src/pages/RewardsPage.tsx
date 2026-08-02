import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRewardEvents, useEarnings } from "@/hooks/use-api";

export function RewardsPage() {
  const rewards = useRewardEvents();
  const summary = useEarnings();
  const list = rewards.data;
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const statusVariant = (s: string) =>
    s === "approved" ? "default" : s === "reversed" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rewards</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Today", value: summary.data?.today ?? 0 },
          { label: "Yesterday", value: summary.data?.yesterday ?? 0 },
          { label: "7 Days", value: summary.data?.last7Days ?? 0 },
          { label: "30 Days", value: summary.data?.last30Days ?? 0 },
          { label: "Lifetime", value: summary.data?.lifetime ?? 0 },
        ].map((r) => (
          <Card key={r.label} className="glass border-white/20">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{r.label}</p>
              {summary.isLoading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-bold">{fmt(r.value)}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Reward Events</CardTitle></CardHeader>
        <CardContent>
          {rewards.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{fmt(r.finalAmountCents)}</TableCell>
                      <TableCell><Badge variant={statusVariant(r.status)}>{r.status}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{r.userId}</TableCell>
                    </TableRow>
                  ))}
                  {list.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No reward events.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RewardsPage;
