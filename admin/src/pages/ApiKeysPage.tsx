import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useSWR from "swr";
import { request } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";

type AdminApiKey = { id: string; userId: string; keyPrefix: string; lastUsedAt: string | null; createdAt: string };

export function ApiKeysPage() {
  const { data: list, isLoading } = useSWR<AdminApiKey[]>("/v1/admin/api-keys", () => request<AdminApiKey[]>("/v1/admin/api-keys"), adminSwr);

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><FileText className="size-6" />API Keys</h1>
      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Platform API Keys</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader><TableRow><TableHead>Prefix</TableHead><TableHead>User</TableHead><TableHead>Last Used</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(list ?? []).map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-mono text-xs">{k.keyPrefix}</TableCell>
                      <TableCell className="font-mono text-xs">{k.userId.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(k.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No API keys.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ApiKeysPage;
