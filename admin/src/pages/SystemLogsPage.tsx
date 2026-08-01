import { FileText, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { SystemLog } from "@iprn/types";

export function SystemLogsPage() {
  const { data: list, isLoading } = useSWR<SystemLog[]>("/v1/admin/system-logs", () => apiClient.admin.systemLogs(), adminSwr);

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Shield className="size-6" />System Logs</h1>
      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Logs</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Level</TableHead><TableHead>Category</TableHead><TableHead>Message</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(list ?? []).map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{new Date(l.createdAt).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={l.level === "error" ? "destructive" : l.level === "warn" ? "secondary" : "default"}>{l.level}</Badge></TableCell>
                      <TableCell>{l.category}</TableCell>
                      <TableCell className="text-sm">{l.message}</TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No system logs.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

void FileText;
export default SystemLogsPage;
