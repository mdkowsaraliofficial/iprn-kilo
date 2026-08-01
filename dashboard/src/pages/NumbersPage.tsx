import { useState } from "react";
import { Globe, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { mutate } from "swr";
import { apiClient } from "@iprn/api-client";
import { useNumbers, useAvailableNumbers } from "@/hooks/use-api";
import type { NumberRecord } from "@iprn/types";

export function NumbersPage() {
  const numbers = useNumbers();
  const available = useAvailableNumbers();
  const list = numbers.data;

  const [countryCode, setCountryCode] = useState("");
  const [operator, setOperator] = useState("");
  const [quantity, setQuantity] = useState(1);

  async function requestNumber() {
    if (!countryCode || !operator) {
      toast.error("Country and operator are required");
      return;
    }
    try {
      await apiClient.requestNumber({ countryCode, operator, quantity });
      mutate("/v1/numbers");
      toast.success(`Requested ${quantity} number(s)`);
    } catch (e) {
      toast.error("Failed to request number");
    }
  }

  async function release(id: string) {
    try {
      await apiClient.releaseNumber(id);
      mutate("/v1/numbers");
      toast.success("Number released");
    } catch (e) {
      toast.error("Failed to release number");
    }
  }

  const statusVariant = (s: NumberRecord["status"]) =>
    s === "assigned" ? "default" : s === "suspended" ? "destructive" : s === "expired" ? "secondary" : "outline";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Numbers</h1>

      <Card className="glass border-white/20 max-w-2xl">
        <CardHeader>
          <CardTitle>Request a Number</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Input placeholder="Country (e.g. GB)" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} />
          <Input placeholder="Operator" value={operator} onChange={(e) => setOperator(e.target.value)} />
          <Input type="number" min={1} max={100} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
          <Button onClick={requestNumber} className="sm:col-span-1">Request</Button>
        </CardContent>
      </Card>

      {available.data && (
        <Card className="glass border-white/20">
          <CardHeader><CardTitle>Available by Country</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Country</TableHead><TableHead className="text-right">Available</TableHead><TableHead className="text-right">Assigned</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {available.data.map((c) => (
                  <TableRow key={c.countryCode}>
                    <TableCell className="flex items-center gap-2"><Globe className="size-4" />{c.countryName}</TableCell>
                    <TableCell className="text-right">{c.available}</TableCell>
                    <TableCell className="text-right">{c.assigned}</TableCell>
                    <TableCell className="text-right">{c.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Assigned Numbers</CardTitle></CardHeader>
        <CardContent>
          {numbers.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-mono">{n.e164}</TableCell>
                      <TableCell>{n.operator}</TableCell>
                      <TableCell><Badge variant={statusVariant(n.status)}>{n.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {n.status === "assigned" && (
                          <Button variant="ghost" size="sm" onClick={() => release(n.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {list.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No numbers assigned.</TableCell></TableRow>
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
