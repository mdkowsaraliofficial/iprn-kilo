import { Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { WithdrawalRequest, WithdrawalStatus } from "@iprn/types";

const statusVariant = (s: WithdrawalStatus) =>
  s === "approved" || s === "completed" ? "default" : s === "rejected" ? "destructive" : "secondary";

export function WithdrawalsPage() {
  const { data: list, isLoading } = useSWR<WithdrawalRequest[]>("/v1/admin/withdrawals", () => apiClient.admin.allWithdrawals(), adminSwr);
  const [reviewStatus, setReviewStatus] = useState<WithdrawalStatus>("approved");
  const [reason, setReason] = useState("");

  async function submitReview(id: string) {
    try {
      await apiClient.admin.reviewWithdrawal(id, { status: reviewStatus, reason: reason || undefined });
      mutate("/v1/admin/withdrawals");
      toast.success("Withdrawal reviewed");
    } catch (e: any) {
      toast.error(e?.problem?.detail ?? "Review failed");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Hash className="size-6" />Withdrawals</h1>
      <Card className="glass border-white/20">
        <CardHeader><CardTitle>All Withdrawals</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(list ?? []).map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-xs">{w.userId.slice(0, 8)}</TableCell>
                      <TableCell>${(w.amountCents / 100).toFixed(2)}</TableCell>
                      <TableCell>{w.method}</TableCell>
                      <TableCell><Badge variant={statusVariant(w.status)}>{w.status}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost">Review</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Review Withdrawal</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                              <div>
                                <Label>Status</Label>
                                <Select value={reviewStatus} onValueChange={(v) => setReviewStatus(v as WithdrawalStatus)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Reason</Label>
                                <Input value={reason} onChange={(e) => setReason(e.target.value)} />
                              </div>
                              <Button onClick={() => { submitReview(w.id); }} className="w-full">Save</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {list?.length === 0 && <TableRow><TableCell colSpan={6} className="text-sm text-muted-foreground">No withdrawals.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
export default WithdrawalsPage;
