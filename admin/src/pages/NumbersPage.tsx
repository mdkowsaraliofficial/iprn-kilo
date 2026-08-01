import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { NumberRecord } from "@iprn/types";

export function NumbersPage() {
  const { data: list, isLoading } = useSWR<NumberRecord[]>("/v1/admin/numbers", () => apiClient.admin.numbers(), adminSwr);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await apiClient.admin.uploadNumbers(file);
      toast.success(`${res.imported} number(s) imported`);
      mutate("/v1/admin/numbers");
    } catch (err: any) {
      toast.error(err?.problem?.detail ?? "Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Numbers</h1>
        <label className="cursor-pointer">
          <input type="file" accept=".csv,text/csv" ref={fileRef} className="hidden" onChange={handleImport} />
          <Button variant="outline" disabled={importing}>
            <Upload className="size-4 mr-2" />Import CSV
          </Button>
        </label>
      </div>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>All Numbers</CardTitle></CardHeader>
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
                    <TableHead>E164</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list?.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-mono">{n.e164}</TableCell>
                      <TableCell>{n.operator}</TableCell>
                      <TableCell>
                        <Badge variant={n.status === "assigned" ? "default" : n.status === "suspended" ? "destructive" : "outline"}>{n.status}</Badge>
                      </TableCell>
                      <TableCell>{n.qualityScore}</TableCell>
                      <TableCell className="font-mono text-xs">{n.assignedUserId ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">No numbers.</TableCell></TableRow>
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

export default NumbersPage;
