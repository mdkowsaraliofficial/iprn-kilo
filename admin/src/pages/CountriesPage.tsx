import { Globe, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { Country } from "@iprn/types";

export function CountriesPage() {
  const { data: list, isLoading } = useSWR<Country[]>("/v1/admin/countries", () => apiClient.admin.countries(), adminSwr);

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Globe className="size-6" />Countries</h1>
      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Countries</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Reward Multiplier</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(list ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{c.code}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.baseRewardMultiplier}</TableCell>
                      <TableCell>{c.active ? <Check className="size-4 text-neon-green" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No countries.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CountriesPage;
