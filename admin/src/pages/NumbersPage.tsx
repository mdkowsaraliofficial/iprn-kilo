import { useRef, useState } from "react";
import { Upload, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { NumberRecord, AdminUser, NumberStatus } from "@iprn/types";

function hoursSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function withinDays(iso: string | null | undefined, days: number): boolean {
  const h = hoursSince(iso);
  return h !== null && h <= days * 24;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="glass border-white/20">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function NumbersPage() {
  const { data: list, isLoading } = useSWR<NumberRecord[]>("/v1/admin/numbers", () => apiClient.admin.numbers(), adminSwr);
  const { data: users } = useSWR<AdminUser[]>("/v1/admin/users", () => apiClient.admin.users(), adminSwr);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState("");

  const assigned = list?.filter((n) => n.assignedUserId) ?? [];
  const zeroSms24h = assigned.filter((n) => !withinDays(n.lastSmsAt, 1));
  const inactiveUsers = new Set(zeroSms24h.map((n) => n.assignedUserId as string)).size;

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

  async function updateNumber(id: string, data: { status?: NumberStatus; assignedUserId?: string | null }) {
    try {
      await apiClient.admin.updateNumber(id, data);
      mutate("/v1/admin/numbers");
      mutate("/v1/admin/stats");
    } catch (err: any) {
      toast.error(err?.problem?.detail ?? "Action failed");
    }
  }

  async function reclaim(id: string) {
    await updateNumber(id, { status: "available", assignedUserId: null });
    toast.success("Number reclaimed to available pool");
  }

  async function assign() {
    if (!assignId || !assignUserId) return;
    await updateNumber(assignId, { assignedUserId: assignUserId });
    setAssignId(null);
    setAssignUserId("");
    toast.success("Number assigned");
  }

  async function remove(id: string) {
    try {
      await apiClient.admin.deleteNumber(id);
      mutate("/v1/admin/numbers");
      toast.success("Number deleted");
    } catch (err: any) {
      toast.error(err?.problem?.detail ?? "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Number Lock System</h1>
        <label className="cursor-pointer">
          <input type="file" accept=".csv,text/csv" ref={fileRef} className="hidden" onChange={handleImport} />
          <Button variant="outline" disabled={importing}>
            {importing ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <Upload className="size-4 mr-2" />}
            Import CSV
          </Button>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total" value={list?.length ?? 0} />
        <Stat label="Assigned" value={assigned.length} />
        <Stat label="Inactive 24h" value={zeroSms24h.length} />
        <Stat label="Inactive Users" value={inactiveUsers} />
        <Stat label="Active 3 days" value={assigned.filter((n) => withinDays(n.lastSmsAt, 3)).length} />
        <Stat label="Active 7 days" value={assigned.filter((n) => withinDays(n.lastSmsAt, 7)).length} />
        <Stat label="Active 15 days" value={assigned.filter((n) => withinDays(n.lastSmsAt, 15)).length} />
        <Stat label="Active 30 days" value={assigned.filter((n) => withinDays(n.lastSmsAt, 30)).length} />
      </div>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Numbers</CardTitle></CardHeader>
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
                    <TableHead>Last SMS</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list?.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-mono text-xs">{n.e164}</TableCell>
                      <TableCell>{n.operator}</TableCell>
                      <TableCell>
                        <Badge variant={n.status === "assigned" ? "default" : n.status === "suspended" ? "destructive" : n.status === "expired" ? "secondary" : "outline"}>{n.status}</Badge>
                      </TableCell>
                      <TableCell>{n.qualityScore}</TableCell>
                      <TableCell className="font-mono text-xs">{n.assignedUserId?.slice(0, 8) ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{n.lastSmsAt ? new Date(n.lastSmsAt).toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {n.assignedUserId && (
                          <Button variant="ghost" size="sm" onClick={() => reclaim(n.id)} title="Reclaim to available pool">
                            <RefreshCw className="size-4" /> Reclaim
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setAssignId(n.id)} title="Assign to user">
                          <UserPlus className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(n.id)} title="Delete">
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-sm text-muted-foreground">No numbers.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!assignId} onOpenChange={(open) => !open && setAssignId(null)}>
        <DialogTrigger asChild>
          <Button variant="outline" className="hidden">Assign</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Number</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={assignUserId} onValueChange={setAssignUserId}>
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {(users ?? []).map((u) => <SelectItem key={u.id} value={u.id}>{u.displayName} ({u.email})</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={assign} disabled={!assignUserId}>Assign</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default NumbersPage;
