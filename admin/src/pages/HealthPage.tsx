import { CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import { adminSwr } from "@app/lib/swr";
import type { HealthStatus, HealthComponent } from "@iprn/types";

const variant = (s: HealthComponent["status"]) =>
  s === "healthy" ? "default" : s === "degraded" ? "secondary" : "destructive";

export function HealthPage() {
  const { data: health, isLoading } = useSWR<HealthStatus>("/v1/public/health", () => apiClient.health(), adminSwr);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Health Monitor</h1>

      <Card className="glass border-white/20">
        <CardHeader><CardTitle>System Status</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={variant(health?.status ?? "down")}>{health?.status ?? "unknown"}</Badge>
                <span className="text-xs text-muted-foreground">version {health?.version ?? "—"}</span>
                <span className="ml-auto text-xs text-muted-foreground">{health?.timestamp}</span>
              </div>
              {(health?.components ?? []).map((c: HealthComponent) => (
                <div key={c.name} className="flex items-center justify-between rounded-lg border-white/5 p-2">
                  <div className="flex items-center gap-2">
                    {c.status === "healthy" ? <CheckCircle className="size-4 text-neon-green" /> : <XCircle className="size-4 text-destructive" />}
                    <span className="text-sm">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.latencyMs !== null && <span className="text-xs text-muted-foreground">{c.latencyMs} ms</span>}
                    <Badge variant={variant(c.status)}>{c.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default HealthPage;
