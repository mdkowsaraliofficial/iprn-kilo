import { Wallet, PiggyBank, Snowflake, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWalletBalance, useWalletTransactions } from "@/hooks/use-api";
import type { WalletTransaction } from "@iprn/types";

function BalanceCard({ label, value, icon: Icon, loading }: { label: string; value: number; icon: typeof Wallet; loading: boolean }) {
  return (
    <Card className="glass border-white/20">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-neon-cyan/10">
          <Icon className="size-5 text-neon-cyan" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-bold">${(value / 100).toFixed(2)}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function WalletPage() {
  const { data: balance, isLoading: balLoading } = useWalletBalance();
  const transactions = useWalletTransactions();

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const typeLabel = (t: WalletTransaction["type"]) =>
    t.replace(/_/g, " ");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard label="Approved" value={balance?.approvedCents ?? 0} icon={Wallet} loading={balLoading} />
        <BalanceCard label="Pending" value={balance?.pendingCents ?? 0} icon={PiggyBank} loading={balLoading} />
        <BalanceCard label="Frozen" value={balance?.frozenCents ?? 0} icon={Snowflake} loading={balLoading} />
        <BalanceCard label="Lifetime Earned" value={balance?.lifetimeEarnedCents ?? 0} icon={TrendingUp} loading={balLoading} />
      </div>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          {transactions.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.data.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{typeLabel(tx.type)}</TableCell>
                      <TableCell>{fmt(tx.amountCents)}</TableCell>
                      <TableCell>{fmt(tx.balanceAfterCents)}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.reason ?? "—"}</TableCell>
                      <TableCell className="text-right text-xs">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {transactions.data.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">No transactions yet.</TableCell></TableRow>
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

export default WalletPage;
