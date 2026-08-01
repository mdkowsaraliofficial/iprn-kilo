import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSms, useLatestSms } from "@/hooks/use-api";

export function SmsPage() {
  const smsList = useSms();
  const latest = useLatestSms();
  const list = smsList.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SMS Messages</h1>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Latest SMS</CardTitle></CardHeader>
        <CardContent>
          {latest.isLoading ? (
            <Skeleton className="h-6 w-48" />
          ) : latest.data ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">From {latest.data.sender} · {latest.data.country}/{latest.data.operator}</p>
              <p className="text-lg">{latest.data.body}</p>
              {latest.data.extractedOtp && <Badge variant="default">OTP: {latest.data.extractedOtp}</Badge>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Received SMS</CardTitle></CardHeader>
        <CardContent>
          {smsList.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sender</TableHead>
                    <TableHead>Body</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>OTP</TableHead>
                    <TableHead>Reward</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.sender}</TableCell>
                      <TableCell className="max-w-md">{s.body}</TableCell>
                      <TableCell>{s.country}</TableCell>
                      <TableCell>{s.extractedOtp ?? "—"}</TableCell>
                      <TableCell>{s.rewardEventId ? "credited" : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {list.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">No SMS messages.</TableCell></TableRow>
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

export default SmsPage;
