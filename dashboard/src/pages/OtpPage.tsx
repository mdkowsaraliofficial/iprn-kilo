import { Copy, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLatestOtp } from "@/hooks/use-api";

export function OtpPage() {
  const { data: otp, isLoading, error } = useLatestOtp();

  const copy = (text: string) => {
    if (typeof navigator !== "undefined") navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">One-Time Passwords</h1>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Latest OTP</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-32" />
          ) : error ? (
            <Badge variant="destructive">No OTP available</Badge>
          ) : (
            <div className="flex items-center gap-3">
              <code className="text-3xl font-mono font-bold tracking-wider">{otp?.code ?? "—"}</code>
              {otp && (
                <Button variant="ghost" size="sm" onClick={() => copy(otp.code)}>
                  <Copy className="size-4" />
                </Button>
              )}
            </div>
          )}
          {otp && <p className="mt-2 text-xs text-muted-foreground">SMS id: {otp.smsId}</p>}
        </CardContent>
      </Card>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>OTP History</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>SMS ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={2} className="text-sm text-muted-foreground">No recent OTP history via this client.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle className="size-3" /> Latest OTP updates in real time via SSE.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default OtpPage;
