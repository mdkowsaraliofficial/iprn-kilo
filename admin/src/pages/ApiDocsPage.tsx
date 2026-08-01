import { BookText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Endpoint = { method: string; path: string; auth: string; description: string };

const endpoints: Endpoint[] = [
  { method: "GET", path: "/api/v1/public/health", auth: "public", description: "System health status" },
  { method: "GET", path: "/api/v1/public/countries", auth: "public", description: "List supported countries" },
  { method: "GET", path: "/api/v1/public/operators/:country", auth: "public", description: "List operators for a country" },
  { method: "POST", path: "/api/v1/auth/register", auth: "public", description: "Register a new account" },
  { method: "POST", path: "/api/v1/auth/login", auth: "public", description: "Log in and return access/refresh tokens" },
  { method: "GET", path: "/api/v1/auth/me", auth: "user", description: "Current user profile" },
  { method: "PUT", path: "/api/v1/auth/me", auth: "user", description: "Update user profile" },
  { method: "POST", path: "/api/v1/ingest/sms", auth: "user", description: "Ingest an inbound SMS" },
  { method: "GET", path: "/api/v1/numbers", auth: "user", description: "List assigned numbers (paginated)" },
  { method: "POST", path: "/api/v1/numbers/request", auth: "user", description: "Request new numbers" },
  { method: "DELETE", path: "/api/v1/numbers/:id/release", auth: "user", description: "Release a number" },
  { method: "GET", path: "/api/v1/sms", auth: "user", description: "List received SMS" },
  { method: "GET", path: "/api/v1/sms/latest", auth: "user", description: "Latest SMS" },
  { method: "GET", path: "/api/v1/otp/latest", auth: "user", description: "Latest extracted OTP" },
  { method: "GET", path: "/api/v1/otp/history", auth: "user", description: "OTP history (paginated)" },
  { method: "GET", path: "/api/v1/wallet", auth: "user", description: "Wallet balance" },
  { method: "GET", path: "/api/v1/wallet/transactions", auth: "user", description: "Wallet transactions (paginated)" },
  { method: "POST", path: "/api/v1/withdrawals", auth: "user", description: "Submit withdrawal request" },
  { method: "GET", path: "/api/v1/withdrawals", auth: "user", description: "List withdrawals" },
  { method: "GET", path: "/api/v1/rewards", auth: "user", description: "List reward events" },
  { method: "GET", path: "/api/v1/rewards/summary", auth: "user", description: "Reward earnings summary" },
  { method: "GET", path: "/api/v1/rewards/:id", auth: "user", description: "Reward event detail" },
  { method: "GET", path: "/api/v1/analytics/summary", auth: "user", description: "Analytics summary" },
  { method: "GET", path: "/api/v1/analytics/sms-by-day", auth: "user", description: "SMS per day" },
  { method: "GET", path: "/api/v1/analytics/earnings-by-day", auth: "user", description: "Earnings per day" },
  { method: "GET", path: "/api/v1/analytics/sms-by-country", auth: "user", description: "SMS by country" },
  { method: "GET", path: "/api/v1/analytics/sms-by-operator", auth: "user", description: "SMS by operator" },
  { method: "GET", path: "/api/v1/settings/profile", auth: "user", description: "User settings profile" },
  { method: "GET", path: "/api/v1/notifications", auth: "user", description: "List notifications" },
  { method: "GET", path: "/api/v1/sse/events", auth: "user", description: "Server-sent events stream" },
];

const adminEndpoints: Endpoint[] = [
  { method: "GET", path: "/api/v1/admin/stats", auth: "admin", description: "Platform overview stats" },
  { method: "GET", path: "/api/v1/admin/users", auth: "admin", description: "List all users" },
  { method: "GET", path: "/api/v1/admin/users/:id", auth: "admin", description: "User detail" },
  { method: "PUT", path: "/api/v1/admin/users/:id", auth: "admin", description: "Update user" },
  { method: "POST", path: "/api/v1/admin/wallet/:userId/adjust", auth: "admin", description: "Adjust a user's wallet" },
  { method: "PATCH", path: "/api/v1/admin/wallet/:userId/freeze", auth: "admin", description: "Freeze/unfreeze wallet funds" },
  { method: "GET", path: "/api/v1/admin/numbers", auth: "admin", description: "List all numbers" },
  { method: "POST", path: "/api/v1/admin/numbers", auth: "admin", description: "Create a number" },
  { method: "POST", path: "/api/v1/admin/numbers/import", auth: "admin", description: "Import numbers via CSV" },
  { method: "PUT", path: "/api/v1/admin/numbers/:id", auth: "admin", description: "Update a number" },
  { method: "DELETE", path: "/api/v1/admin/numbers/:id", auth: "admin", description: "Delete a number" },
  { method: "GET", path: "/api/v1/admin/reward-rules", auth: "admin", description: "List reward rules" },
  { method: "POST", path: "/api/v1/admin/reward-rules", auth: "admin", description: "Create a reward rule" },
  { method: "PUT", path: "/api/v1/admin/reward-rules/:id", auth: "admin", description: "Update a reward rule" },
  { method: "DELETE", path: "/api/v1/admin/reward-rules/:id", auth: "admin", description: "Delete a reward rule" },
  { method: "GET", path: "/api/v1/admin/providers", auth: "admin", description: "List providers" },
  { method: "POST", path: "/api/v1/admin/providers", auth: "admin", description: "Create a provider" },
  { method: "PUT", path: "/api/v1/admin/providers/:id", auth: "admin", description: "Update a provider" },
  { method: "GET", path: "/api/v1/admin/countries", auth: "admin", description: "List countries" },
  { method: "GET", path: "/api/v1/admin/operators", auth: "admin", description: "List operators" },
  { method: "GET", path: "/api/v1/admin/withdrawals", auth: "admin", description: "List all withdrawals" },
  { method: "POST", path: "/api/v1/admin/withdrawals/:id/review", auth: "admin", description: "Review a withdrawal" },
  { method: "GET", path: "/api/v1/admin/webhooks", auth: "admin", description: "List all webhooks" },
  { method: "GET", path: "/api/v1/admin/webhook-deliveries", auth: "admin", description: "List webhook deliveries" },
  { method: "GET", path: "/api/v1/admin/api-keys", auth: "admin", description: "List all API keys" },
  { method: "DELETE", path: "/api/v1/admin/api-keys/:id", auth: "admin", description: "Delete an API key" },
  { method: "PATCH", path: "/api/v1/admin/api-keys/:id", auth: "admin", description: "Update an API key" },
  { method: "GET", path: "/api/v1/admin/audit-logs", auth: "admin", description: "List audit logs" },
  { method: "GET", path: "/api/v1/admin/system-logs", auth: "admin", description: "List system logs" },
  { method: "GET", path: "/api/v1/admin/system-settings", auth: "admin", description: "List system settings" },
  { method: "PUT", path: "/api/v1/admin/system-settings/:key", auth: "admin", description: "Update a system setting" },
  { method: "POST", path: "/api/v1/admin/notifications/send", auth: "admin", description: "Send a platform notification" },
];

export function ApiDocsPage() {
  return (
    <div className="space-y-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><BookText className="size-6" /> API Documentation</h1>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Client API (user)</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader><TableRow><TableHead>Method</TableHead><TableHead>Path</TableHead><TableHead>Auth</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
              <TableBody>
                {endpoints.map((e) => (
                  <TableRow key={`${e.method}-${e.path}`}>
                    <TableCell><Badge variant="outline">{e.method}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{e.path}</TableCell>
                    <TableCell>{e.auth}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Admin API</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10">
            <Table>
              <TableHeader><TableRow><TableHead>Method</TableHead><TableHead>Path</TableHead><TableHead>Auth</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
              <TableBody>
                {adminEndpoints.map((e) => (
                  <TableRow key={`${e.method}-${e.path}`}>
                    <TableCell><Badge variant="outline">{e.method}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{e.path}</TableCell>
                    <TableCell>{e.auth}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Authentication</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pass the access token in the <code className="rounded bg-white/10 px-1">Authorization: Bearer &lt;token&gt;</code>{" "}
            header. Token format is a signed JWT. Refresh expired access tokens via{" "}
            <code className="rounded bg-white/10 px-1">POST /api/v1/auth/refresh</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
export default ApiDocsPage;
