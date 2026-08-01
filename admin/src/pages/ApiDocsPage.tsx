import { BookText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Endpoint = { method: string; path: string; auth: string; description: string };

const endpoints: Endpoint[] = [
  { method: "GET", path: "/api/v1/public/health", auth: "public", description: "System health status" },
  { method: "GET", path: "/api/v1/public/countries", auth: "public", description: "List supported countries" },
  { method: "GET", path: "/api/v1/public/operators/:country", auth: "public", description: "List operators for a country" },
  { method: "POST", path: "/api/v1/register", auth: "public", description: "Register a new account" },
  { method: "POST", path: "/api/v1/login", auth: "public", description: "Log in and return access/refresh tokens" },
  { method: "POST", path: "/api/v1/refresh", auth: "public", description: "Exchange a refresh token for a new access/refresh token pair" },
  { method: "POST", path: "/api/v1/logout", auth: "user", description: "Revoke the current refresh token" },
  { method: "GET", path: "/api/v1/me", auth: "user", description: "Current user profile" },
  { method: "PUT", path: "/api/v1/me", auth: "user", description: "Update the current user profile" },
  { method: "POST", path: "/api/v1/ingest/sms", auth: "user", description: "Ingest an inbound SMS" },
  { method: "GET", path: "/api/v1/numbers", auth: "user", description: "List assigned numbers (paginated)" },
  { method: "GET", path: "/api/v1/numbers/available", auth: "user", description: "List available number/country summary" },
  { method: "POST", path: "/api/v1/numbers/request", auth: "user", description: "Request new numbers" },
  { method: "GET", path: "/api/v1/numbers/:id", auth: "user", description: "Number detail" },
  { method: "DELETE", path: "/api/v1/numbers/:id/release", auth: "user", description: "Release a number" },
  { method: "GET", path: "/api/v1/sms", auth: "user", description: "List received SMS (paginated)" },
  { method: "GET", path: "/api/v1/sms/latest", auth: "user", description: "Latest SMS" },
  { method: "GET", path: "/api/v1/sms/:id", auth: "user", description: "SMS detail" },
  { method: "GET", path: "/api/v1/sms/by-number/:numberId", auth: "user", description: "SMS for a number (paginated)" },
  { method: "GET", path: "/api/v1/otp/latest", auth: "user", description: "Latest extracted OTP" },
  { method: "GET", path: "/api/v1/otp/history", auth: "user", description: "OTP history (paginated)" },
  { method: "GET", path: "/api/v1/otp/by-number/:numberId", auth: "user", description: "Latest OTP for a number" },
  { method: "GET", path: "/api/v1/wallet", auth: "user", description: "Wallet balance and totals" },
  { method: "GET", path: "/api/v1/wallet/transactions", auth: "user", description: "Wallet transactions (paginated)" },
  { method: "POST", path: "/api/v1/withdrawals", auth: "user", description: "Submit withdrawal request" },
  { method: "GET", path: "/api/v1/withdrawals", auth: "user", description: "List withdrawals" },
  { method: "GET", path: "/api/v1/withdrawals/:id", auth: "user", description: "Withdrawal detail" },
  { method: "GET", path: "/api/v1/transactions", auth: "user", description: "Ledger transactions (paginated)" },
  { method: "GET", path: "/api/v1/rewards", auth: "user", description: "List reward events" },
  { method: "GET", path: "/api/v1/rewards/summary", auth: "user", description: "Reward earnings summary" },
  { method: "GET", path: "/api/v1/rewards/:id", auth: "user", description: "Reward event detail" },
  { method: "GET", path: "/api/v1/webhooks", auth: "user", description: "List user webhooks" },
  { method: "POST", path: "/api/v1/webhooks", auth: "user", description: "Create a webhook" },
  { method: "PUT", path: "/api/v1/webhooks/:id", auth: "user", description: "Update a webhook" },
  { method: "DELETE", path: "/api/v1/webhooks/:id", auth: "user", description: "Delete a webhook" },
  { method: "POST", path: "/api/v1/webhooks/:id/test", auth: "user", description: "Trigger a test delivery" },
  { method: "GET", path: "/api/v1/webhooks/:id/deliveries", auth: "user", description: "Delivery history for a webhook" },
  { method: "POST", path: "/api/v1/ingest/webhook/:providerId", auth: "public", description: "Public webhook receiver for a provider" },
  { method: "GET", path: "/api/v1/api-keys", auth: "user", description: "List API keys" },
  { method: "POST", path: "/api/v1/api-keys", auth: "user", description: "Create an API key" },
  { method: "DELETE", path: "/api/v1/api-keys/:id", auth: "user", description: "Revoke an API key" },
  { method: "POST", path: "/api/v1/api-keys/:id/rotate", auth: "user", description: "Rotate an API key secret" },
  { method: "GET", path: "/api/v1/api-keys/:id/usage", auth: "user", description: "Usage metrics for an API key" },
  { method: "GET", path: "/api/v1/api-keys/:id/logs", auth: "user", description: "Request logs for an API key" },
  { method: "GET", path: "/api/v1/notifications", auth: "user", description: "List notifications (paginated)" },
  { method: "PUT", path: "/api/v1/notifications/:id/read", auth: "user", description: "Mark a notification read" },
  { method: "PUT", path: "/api/v1/notifications/read-all", auth: "user", description: "Mark all notifications read" },
  { method: "DELETE", path: "/api/v1/notifications/:id", auth: "user", description: "Delete a notification" },
  { method: "GET", path: "/api/v1/analytics/summary", auth: "user", description: "Analytics summary" },
  { method: "GET", path: "/api/v1/analytics/sms-by-day", auth: "user", description: "SMS per day" },
  { method: "GET", path: "/api/v1/analytics/earnings-by-day", auth: "user", description: "Earnings per day" },
  { method: "GET", path: "/api/v1/analytics/sms-by-country", auth: "user", description: "SMS by country" },
  { method: "GET", path: "/api/v1/analytics/sms-by-operator", auth: "user", description: "SMS by operator" },
  { method: "GET", path: "/api/v1/settings/profile", auth: "user", description: "User settings profile" },
  { method: "PUT", path: "/api/v1/settings/profile", auth: "user", description: "Update settings profile" },
  { method: "PUT", path: "/api/v1/settings/notifications", auth: "user", description: "Update notification preferences" },
  { method: "GET", path: "/api/v1/sse/events", auth: "user", description: "Server-sent events stream" },
];

const adminEndpoints: Endpoint[] = [
  { method: "GET", path: "/api/v1/admin/stats", auth: "admin", description: "Platform overview stats" },
  { method: "GET", path: "/api/v1/admin/users", auth: "admin", description: "List all users" },
  { method: "GET", path: "/api/v1/admin/users/:id", auth: "admin", description: "User detail" },
  { method: "PUT", path: "/api/v1/admin/users/:id", auth: "admin", description: "Update user" },
  { method: "POST", path: "/api/v1/admin/wallet/:userId/adjust", auth: "admin", description: "Adjust a user wallet" },
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
  { method: "GET", path: "/api/v1/admin/countries", auth: "admin", description: "List countries" },
  { method: "PUT", path: "/api/v1/admin/countries/:code", auth: "admin", description: "Update a country" },
  { method: "GET", path: "/api/v1/admin/operators", auth: "admin", description: "List operators" },
  { method: "POST", path: "/api/v1/admin/operators", auth: "admin", description: "Create an operator" },
  { method: "PUT", path: "/api/v1/admin/operators/:id", auth: "admin", description: "Update an operator" },
  { method: "GET", path: "/api/v1/admin/providers", auth: "admin", description: "List providers" },
  { method: "POST", path: "/api/v1/admin/providers", auth: "admin", description: "Create a provider" },
  { method: "PUT", path: "/api/v1/admin/providers/:id", auth: "admin", description: "Update a provider" },
  { method: "GET", path: "/api/v1/admin/withdrawals", auth: "admin", description: "List all withdrawals" },
  { method: "POST", path: "/api/v1/admin/withdrawals/:id/review", auth: "admin", description: "Review a withdrawal" },
  { method: "GET", path: "/api/v1/admin/webhooks", auth: "admin", description: "List all webhooks" },
  { method: "GET", path: "/api/v1/admin/webhook-deliveries", auth: "admin", description: "List webhook deliveries" },
  { method: "GET", path: "/api/v1/admin/api-keys", auth: "admin", description: "List all API keys" },
  { method: "DELETE", path: "/api/v1/admin/api-keys/:id", auth: "admin", description: "Revoke an API key" },
  { method: "PATCH", path: "/api/v1/admin/api-keys/:id", auth: "admin", description: "Update an API key" },
  { method: "GET", path: "/api/v1/admin/audit-logs", auth: "admin", description: "List audit logs" },
  { method: "GET", path: "/api/v1/admin/system-logs", auth: "admin", description: "List system logs" },
  { method: "GET", path: "/api/v1/admin/system-settings", auth: "admin", description: "List system settings" },
  { method: "PUT", path: "/api/v1/admin/system-settings/:key", auth: "admin", description: "Update a system setting" },
  { method: "POST", path: "/api/v1/admin/notifications/send", auth: "admin", description: "Send a platform notification" },
];

function renderTable(name: string, list: Endpoint[]) {
  return (
    <Card className="glass border-white/20">
      <CardHeader><CardTitle>{name}</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-md border border-white/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((e) => (
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
  );
}

export function ApiDocsPage() {
  return (
    <div className="space-y-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <BookText className="size-6" />
        API Documentation
      </h1>

      {renderTable("Client API (user)", endpoints)}
      {renderTable("Admin API", adminEndpoints)}

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>Authentication</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            User requests are authenticated with <code className="rounded bg-white/10 px-1">Authorization: Bearer &lt;token&gt;</code>
            ,             where <code className="rounded bg-white/10 px-1">&lt;token&gt;</code> is the opaque bearer token returned by <code className="rounded bg-white/10 px-1">POST /api/v1/login</code>.
            Refresh expired access tokens via <code className="rounded bg-white/10 px-1">POST /api/v1/refresh</code> with <code className="rounded bg-white/10 px-1">{"{ \"refreshToken\": \"<token>\" }"}</code>.
            Admin requests require an <code className="rounded bg-white/10 px-1">x-admin-token</code> header matching the worker <code className="rounded bg-white/10 px-1">ADMIN_TOKEN</code> secret; on mismatch the request is rejected as unauthorized (401). All error responses are RFC 7807 <code className="rounded bg-white/10 px-1">application/problem+json</code> documents.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ApiDocsPage;
