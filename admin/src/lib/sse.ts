import { useEffect } from "react";
import { createSseStream } from "@iprn/api-client";
import type { AnySseEvent } from "@iprn/api-client";
import { mutate } from "swr";

export function useAdminSse(userId: string | null | undefined, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled || !userId) return;

    const source = createSseStream("/v1/sse/events", (event: AnySseEvent) => {
      switch (event.type) {
        case "sms.received":
          mutate("/v1/admin/stats");
          mutate("/v1/analytics/summary");
          break;
        case "otp.extracted":
          mutate("/v1/admin/stats");
          break;
        case "reward.credited":
          mutate("/v1/rewards/summary");
          mutate("/v1/admin/stats");
          mutate("/v1/wallet");
          break;
        case "wallet.updated":
          mutate("/v1/wallet");
          mutate("/v1/admin/stats");
          break;
        case "number.assigned":
        case "number.released":
          mutate("/v1/admin/numbers");
          mutate("/v1/admin/stats");
          mutate("/v1/numbers");
          mutate("/v1/numbers/available");
          break;
        case "notification.new":
          mutate("/v1/notifications?limit=20");
          mutate("/v1/admin/audit-logs");
          break;
        case "withdrawal.status":
          mutate("/v1/admin/withdrawals");
          mutate("/v1/withdrawals?limit=20");
          break;
      }
    });

    return () => source.close();
  }, [enabled, userId]);
}
