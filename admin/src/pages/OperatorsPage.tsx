import { Users, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { Operator } from "@iprn/types";

export function OperatorsPage() {
  const { data: list, isLoading } = useSWR<Operator[]>("/v1/admin/operators", () => apiClient.admin.operators({}), adminSwr);

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Users className="size-6" />Operators</h1>
      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Operators</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Country</TableHead><TableHead>Multiplier</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(list ?? []).map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{o.name}</TableCell>
                      <TableCell>{o.countryCode}</TableCell>
                      <TableCell>{o.rewardMultiplier}</TableCell>
                      <TableCell>{o.active ? <Check className="size-4 text-neon-green" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No operators.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OperatorsPage;
