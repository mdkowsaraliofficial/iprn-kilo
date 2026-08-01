import useSWR from "swr";
import { apiClient } from "@iprn/api-client";
import type {
  AnalyticsSummary,
  RewardSummary,
  WithdrawalRequest,
  SmsMessage,
  RewardEvent,
  WalletTransaction,
  NumberRecord,
  CountryOperatorSummary,
  Notification,
  UserProfile,
  AnalyticsByDay,
} from "@iprn/types";

const swrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
};

export function useMe() {
  return useSWR<UserProfile>("/v1/auth/me", () => apiClient.me(), swrOptions);
}

export function useStats() {
  return useSWR<AnalyticsSummary>("/v1/analytics/summary", () => apiClient.analyticsSummary(), swrOptions);
}

export function useEarnings() {
  return useSWR<RewardSummary>("/v1/rewards/summary", () => apiClient.rewardSummary(), swrOptions);
}

export function useEarningsByDay(from?: string, to?: string) {
  return useSWR<AnalyticsByDay[]>(
    ["/v1/analytics/earnings-by-day", from, to],
    () => apiClient.analyticsEarningsByDay({ from, to }),
    swrOptions
  );
}

export function useSmsByDay(from?: string, to?: string) {
  return useSWR<AnalyticsByDay[]>(
    ["/v1/analytics/sms-by-day", from, to],
    () => apiClient.analyticsSmsByDay({ from, to }),
    swrOptions
  );
}

export function useWithdrawals(limit = 20) {
  const swr = useSWR<{ data: WithdrawalRequest[]; meta: { total: number } }>(
    `/v1/withdrawals?limit=${limit}`,
    () => apiClient.listWithdrawals({ limit }),
    swrOptions
  );
  return { ...swr, data: swr.data?.data ?? [] };
}

export function useNotifications(limit = 20) {
  const swr = useSWR<{ data: Notification[]; meta: { total: number } }>(
    `/v1/notifications?limit=${limit}`,
    () => apiClient.listNotifications({ limit }),
    swrOptions
  );
  return { ...swr, data: swr.data?.data ?? [] };
}

export function useWalletBalance() {
  return useSWR<{
    pendingCents: number;
    approvedCents: number;
    frozenCents: number;
    lifetimeEarnedCents: number;
    lifetimeWithdrawnCents: number;
    withdrawableCents: number;
    updatedAt: string;
  }>("/v1/wallet", () => apiClient.walletBalance(), swrOptions);
}

export function useWalletTransactions(q: Record<string, unknown> = {}) {
  const swr = useSWR<{ data: WalletTransaction[]; meta: { total: number } }>(
    "/v1/wallet/transactions",
    () => apiClient.walletTransactions(q),
    swrOptions
  );
  return { ...swr, data: swr.data?.data ?? [] };
}

export function useNumbers(q: Record<string, unknown> = {}) {
  const swr = useSWR<{ data: NumberRecord[]; meta: { total: number } }>(
    "/v1/numbers",
    () => apiClient.listNumbers(q),
    swrOptions
  );
  return { ...swr, data: swr.data?.data ?? [] };
}

export function useAvailableNumbers() {
  return useSWR<CountryOperatorSummary[]>("/v1/numbers/available", () => apiClient.availableNumbers(), swrOptions);
}

export function useSms(q: Record<string, unknown> = {}) {
  const swr = useSWR<{ data: SmsMessage[]; meta: { total: number } }>(
    "/v1/sms",
    () => apiClient.listSms(q),
    swrOptions
  );
  return { ...swr, data: swr.data?.data ?? [] };
}

export function useLatestSms() {
  return useSWR<SmsMessage | null>("/v1/sms/latest", () => apiClient.latestSms(), swrOptions);
}

export function useLatestOtp() {
  return useSWR<{ code: string; smsId: string } | null>("/v1/otp/latest", () => apiClient.latestOtp(), swrOptions);
}

export function useRewardEvents(q: Record<string, unknown> = {}) {
  const swr = useSWR<{ data: RewardEvent[]; meta: { total: number } }>(
    "/v1/rewards",
    () => apiClient.rewardEvents(q),
    swrOptions
  );
  return { ...swr, data: swr.data?.data ?? [] };
}

export function useTransactions(q: Record<string, unknown> = {}) {
  const swr = useSWR<{ data: WalletTransaction[]; meta: { total: number } }>(
    "/v1/transactions",
    () => apiClient.transactions(q),
    swrOptions
  );
  return { ...swr, data: swr.data?.data ?? [] };
}

export const POLL_INTERVAL = 30000;
export type {
  AnalyticsSummary as Stats,
  RewardSummary as Earnings,
  WithdrawalRequest as Withdrawal,
  Notification,
  CountryOperatorSummary as CoinBalance,
};
