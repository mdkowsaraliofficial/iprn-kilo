import { Globe, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";

type AdminWebhook = { id: string; userId: string; url: string; events: string[]; };

export function WebhooksPage() {
  const { data: list, isLoading } = useSWR<AdminWebhook[]>("/v1/admin/webhooks", () => apiClient.admin.allWebhooks(), adminSwr);

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Globe className="size-6" />Platform Webhooks</h1>
      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Webhooks</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>                    <TableRow><TableHead>URL</TableHead><TableHead>User</TableHead><TableHead>Events</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(list ?? []).map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-xs">{w.url}</TableCell>
                      <TableCell className="font-mono text-xs">{w.userId.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs">{w.events.join(", ")}</TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 &&                     <TableRow><TableCell colSpan={3} className="text-sm text-muted-foreground">No webhooks.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

void Clock;
export default WebhooksPage;
