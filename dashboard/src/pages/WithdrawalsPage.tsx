import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { mutate } from "swr";
import { apiClient } from "@iprn/api-client";
import { useWithdrawals } from "@/hooks/use-api";
import type { WithdrawalRequest, WithdrawalStatus } from "@iprn/types";

const schema = z.object({
  amount: z.string().min(1, "Amount required"),
  method: z.enum(["crypto", "bank_transfer", "paypal", "other"]),
  address: z.string().min(1, "Address required"),
});

type FormValues = z.infer<typeof schema>;

const statusVariant = (s: WithdrawalStatus) =>
  s === "approved" || s === "completed" ? "default" : s === "rejected" ? "destructive" : "secondary";

const StatusIcon = (s: WithdrawalStatus) => {
  switch (s) {
    case "approved":
    case "completed":
      return <CheckCircle className="size-3" />;
    case "rejected":
      return <XCircle className="size-3" />;
    default:
      return <Clock className="size-3" />;
  }
};

export function WithdrawalsPage() {
  const { data: list, isLoading, mutate: refetch } = useWithdrawals(20);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { amount: "", method: "crypto", address: "" } });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const amountCents = Math.round(parseFloat(values.amount) * 100);
      const res = await apiClient.createWithdrawal({ method: values.method, address: values.address, amountCents });
      mutate("/v1/wallet");
      await refetch();
      toast.success(res.message ?? "Withdrawal submitted");
      form.reset();
    } catch (e: any) {
      toast.error(e?.problem?.detail ?? "Failed to submit withdrawal");
    } finally {
      setSubmitting(false);
    }
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Withdrawals</h1>

      <Card className="glass border-white/20 max-w-xl">
        <CardHeader><CardTitle>Request Withdrawal</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="method" render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crypto">Crypto</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet / Account Address</FormLabel>
                  <FormControl><Input placeholder="0x..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={submitting}><Send className="size-4 mr-2" />Submit</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Withdrawal History</CardTitle></CardHeader>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((w: WithdrawalRequest) => (
                    <TableRow key={w.id}>
                      <TableCell><Badge variant={statusVariant(w.status)}>{StatusIcon(w.status)} {w.status}</Badge></TableCell>
                      <TableCell>{fmt(w.amountCents)}</TableCell>
                      <TableCell>{w.method}</TableCell>
                      <TableCell className="text-xs">{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {list.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No withdrawals.</TableCell></TableRow>
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

export default WithdrawalsPage;
