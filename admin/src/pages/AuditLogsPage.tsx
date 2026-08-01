import { FileText, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { AuditLog, AuditSeverity } from "@iprn/types";

const severityVariant = (s: AuditSeverity) =>
  s === "critical" ? "destructive" : s === "warning" ? "secondary" : "default";

export function AuditLogsPage() {
  const [severity, setSeverity] = useState<AuditSeverity | "all">("all");
  const { data: list, isLoading } = useSWR<AuditLog[]>(
    ["/v1/admin/audit-logs", severity],
    () => apiClient.admin.auditLogs(severity === "all" ? {} : { severity }),
    adminSwr
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Shield className="size-6" />Audit Logs</h1>
        <Select value={severity} onValueChange={(v: string) => setSeverity(v as AuditSeverity | "all")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Resource</TableHead><TableHead>Severity</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(list ?? []).map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{new Date(l.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{l.userId?.slice(0, 8) ?? "—"}</TableCell>
                      <TableCell>{l.action}</TableCell>
                      <TableCell>{l.resourceType}{l.resourceId ? `:${l.resourceId}` : ""}</TableCell>
                      <TableCell><Badge variant={severityVariant(l.severity)}>{l.severity}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{l.ip ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && <TableRow><TableCell colSpan={6} className="text-sm text-muted-foreground">No audit logs.</TableCell></TableRow>}
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
export default AuditLogsPage;
