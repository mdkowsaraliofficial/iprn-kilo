import { Globe, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { Provider } from "@iprn/types";

const statusVariant = (s: Provider["status"]) =>
  s === "active" ? "default" : s === "degraded" ? "secondary" : "destructive";

export function ProvidersPage() {
  const { data: list, isLoading } = useSWR<Provider[]>("/v1/admin/providers", () => apiClient.admin.providers(), adminSwr);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Providers</h1>
      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Providers</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><code className="text-xs">{p.slug}</code></TableCell>
                      <TableCell>{p.type}</TableCell>
                      <TableCell><Badge variant={statusVariant(p.status)}>{p.status}</Badge></TableCell>
                      <TableCell>{p.healthScore}</TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">No providers.</TableCell></TableRow>
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

void Activity;
void Globe;
export default ProvidersPage;
