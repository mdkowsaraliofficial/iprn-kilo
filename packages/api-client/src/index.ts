import useSWR, { type SWRConfiguration } from 'swr';
import type {
  User,
  NumberRecord,
  CountryOperatorSummary,
  Country,
  Operator,
  SmsMessage,
  RewardEvent,
  RewardRule,
  WalletBalance,
  WalletTransaction,
  WithdrawalRequest,
  Provider,
  ApiKey,
  WebhookDelivery,
  Notification,
  SystemSetting,
  SystemLog,
  AuditLog,
  HealthStatus,
  UserProfile,
  AnalyticsByDay,
  IngestSmsRequest,
  IngestSmsResponse,
  WebhookConfigInput,
  WithdrawalMethod,
  PaginationMeta,
  ProblemDetail,
} from '@iprn/types';

export type { ProblemDetail } from '@iprn/types';

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetail | null;
  constructor(status: number, problem: ProblemDetail | null = null) {
    super(problem?.title ?? 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
}

const defaultConfig: ApiClientConfig = {
  baseUrl: '/api',
  getToken: () => {
    if (typeof localStorage !== 'undefined') return localStorage.getItem('accessToken');
    return null;
  },
};

let _config: ApiClientConfig = { ...defaultConfig };

export function configureApiClient(config: ApiClientConfig): void {
  _config = { ...defaultConfig, ...config };
}

export function getApiClientConfig(): ApiClientConfig {
  return _config;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  const token = _config.getToken?.();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${_config.baseUrl}${path}`, { ...init, headers });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!res.ok) {
    const problem = parsed as ProblemDetail | null;
    throw new ApiError(res.status, problem);
  }
  return (parsed ?? null) as T;
}

export function getRateLimitInfo(res: Response): { limit: number; remaining: number; reset: number } | null {
  const limit = res.headers.get('X-RateLimit-Limit');
  const remaining = res.headers.get('X-RateLimit-Remaining');
  const reset = res.headers.get('X-RateLimit-Reset');
  if (!limit || !remaining || !reset) return null;
  return { limit: parseInt(limit, 10), remaining: parseInt(remaining, 10), reset: parseInt(reset, 10) };
}

export type SmsEvent = { type: 'sms.received'; sms: SmsMessage; otp: string | null; rewardAmountCents: number };
export type OtpEvent = { type: 'otp.extracted'; smsId: string; userId: string; otp: string };
export type RewardEventPayload = { type: 'reward.credited'; reward: RewardEvent };
export type WalletUpdatedEvent = { type: 'wallet.updated'; userId: string; pendingCents: number; approvedCents: number; frozenCents: number };
export type NumberStatusEvent = { type: 'number.assigned' | 'number.released'; userId: string; number: NumberRecord };
export type NotificationEvent = { type: 'notification.new'; notification: Notification };
export type WithdrawalEvent = { type: 'withdrawal.status'; withdrawal: WithdrawalRequest };

export type AnySseEvent =
  | SmsEvent
  | OtpEvent
  | RewardEventPayload
  | WalletUpdatedEvent
  | NumberStatusEvent
  | NotificationEvent
  | WithdrawalEvent;

export function createSseStream(
  eventPath: string,
  onEvent: (event: AnySseEvent) => void,
  onError?: (err: Event) => void
): EventSource {
  const source = new EventSource(`${_config.baseUrl}${eventPath}`);
  source.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data) as AnySseEvent;
      onEvent(data);
    } catch {
      // non-json keepalive
    }
  };
  if (onError) source.onerror = onError;
  return source;
}

const swrOptions: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
};

function buildQuery(q: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      for (const item of v) parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`);
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export const apiClient = {
  // Auth
  me: () => request<User>('/v1/auth/me'),
  updateProfile: (data: { displayName?: string; email?: string }) =>
    request<User>('/v1/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ accessToken: string; refreshToken: string; user: User }>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: { email: string; password: string; displayName: string }) =>
    request<{ accessToken: string; refreshToken: string; user: User }>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Numbers
  listNumbers: (q: Record<string, unknown> = {}) =>
    request<{ data: NumberRecord[]; meta: PaginationMeta }>('/api/v1/numbers' + buildQuery(q)),
  availableNumbers: () => request<CountryOperatorSummary[]>('/api/v1/numbers/available'),
  requestNumber: (data: { countryCode: string; operator: string; quantity?: number }) =>
    request<{ message: string; assigned: NumberRecord[] }>(
      '/api/v1/numbers/request',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  numberDetail: (id: string) => request<NumberRecord>(`/api/v1/numbers/${id}`),
  releaseNumber: (id: string) =>
    request<{ success: boolean }>(`/api/v1/numbers/${id}/release`, { method: 'DELETE' }),

  // SMS
  listSms: (q: Record<string, unknown> = {}) =>
    request<{ data: SmsMessage[]; meta: PaginationMeta }>('/api/v1/sms' + buildQuery(q)),
  latestSms: () => request<SmsMessage | null>('/api/v1/sms/latest'),
  smsDetail: (id: string) => request<SmsMessage>(`/api/v1/sms/${id}`),
  smsByNumber: (numberId: string, q: Record<string, unknown> = {}) =>
    request<{ data: SmsMessage[]; meta: PaginationMeta }>(
      `/api/v1/sms/by-number/${numberId}` + buildQuery(q)
    ),

  // OTP
  latestOtp: () => request<{ code: string; smsId: string } | null>('/api/v1/otp/latest'),
  otpHistory: (q: Record<string, unknown> = {}) =>
    request<{ data: { code: string; smsId: string; numberId: string; createdAt: string }[]; meta: PaginationMeta }>(
      '/api/v1/otp/history' + buildQuery(q)
    ),
  otpByNumber: (numberId: string) =>
    request<{ code: string; smsId: string; createdAt: string } | null>(
      `/api/v1/otp/by-number/${numberId}`
    ),

  // Wallet
  walletBalance: () =>
    request<{
      pendingCents: number;
      approvedCents: number;
      frozenCents: number;
      lifetimeEarnedCents: number;
      lifetimeWithdrawnCents: number;
      updatedAt: string;
    }>('/api/v1/wallet'),
  walletTransactions: (q: Record<string, unknown> = {}) =>
    request<{ data: WalletTransaction[]; meta: PaginationMeta }>('/api/v1/wallet/transactions' + buildQuery(q)),

  // Rewards
  rewardEvents: (q: Record<string, unknown> = {}) =>
    request<{ data: RewardEvent[]; meta: PaginationMeta }>('/api/v1/rewards' + buildQuery(q)),
  rewardSummary: () =>
    request<{ today: number; yesterday: number; last7Days: number; last30Days: number; lifetime: number }>(
      '/api/v1/rewards/summary'
    ),
  rewardDetail: (id: string) =>
    request<{ rule: RewardRule; event: RewardEvent }>(`/api/v1/rewards/${id}`),

  // Transactions
  transactions: (q: Record<string, unknown> = {}) =>
    request<{ data: WalletTransaction[]; meta: PaginationMeta }>('/api/v1/transactions' + buildQuery(q)),

  // Withdrawals
  createWithdrawal: (data: { method: WithdrawalMethod; address: string; amountCents: number }) =>
    request<WithdrawalRequest>('/api/v1/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listWithdrawals: (q: Record<string, unknown> = {}) =>
    request<{ data: WithdrawalRequest[]; meta: PaginationMeta }>('/api/v1/withdrawals' + buildQuery(q)),
  withdrawalDetail: (id: string) => request<WithdrawalRequest>(`/api/v1/withdrawals/${id}`),

  // Webhooks
  listWebhooks: () =>
    request<Array<WebhookConfigInput & { id: string; createdAt: string }>>('/api/v1/webhooks'),
  createWebhook: (data: WebhookConfigInput) =>
    request<{ id: string; url: string; events: string[]; secret: string }>(
      '/api/v1/webhooks',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  updateWebhook: (id: string, data: Partial<WebhookConfigInput>) =>
    request<{ id: string; url: string; events: string[] }>(
      `/api/v1/webhooks/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),
  deleteWebhook: (id: string) =>
    request<{ success: boolean }>(`/api/v1/webhooks/${id}`, { method: 'DELETE' }),
  webhookDeliveries: (id: string, q: Record<string, unknown> = {}) =>
    request<{ data: WebhookDelivery[]; meta: PaginationMeta }>(
      `/api/v1/webhooks/${id}/deliveries` + buildQuery(q)
    ),
  testWebhook: (id: string) =>
    request<{ status: string }>(`/api/v1/webhooks/${id}/test`, { method: 'POST' }),

  // API Keys
  listApiKeys: () =>
    request<Array<ApiKey & { keyPrefixDisplay: string }>>('/api/v1/api-keys'),
  createApiKey: (data: { name: string; permissions?: string[] }) =>
    request<{ id: string; keyId: string; keyPrefix: string; secret: string }>(
      '/api/v1/api-keys',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  deleteApiKey: (id: string) =>
    request<{ success: boolean }>(`/api/v1/api-keys/${id}`, { method: 'DELETE' }),
  rotateApiKey: (id: string) =>
    request<{ id: string; keyPrefix: string; secret: string }>(
      `/api/v1/api-keys/${id}/rotate`,
      { method: 'POST' }
    ),
  apiKeyUsage: (id: string) =>
    request<{ totalRequests: number; requestsToday: number; topEndpoints: Array<{ endpoint: string; count: number }> }>(
      `/api/v1/api-keys/${id}/usage`
    ),
  apiKeyLogs: (id: string, q: Record<string, unknown> = {}) =>
    request<{ data: Array<{ endpoint: string; method: string; statusCode: number; responseTimeMs: number; createdAt: string }>; meta: PaginationMeta }>(
      `/api/v1/api-keys/${id}/logs` + buildQuery(q)
    ),

  // Notifications
  listNotifications: (q: Record<string, unknown> = {}) =>
    request<{ data: Notification[]; meta: PaginationMeta }>('/api/v1/notifications' + buildQuery(q)),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/v1/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/v1/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id: string) =>
    request<{ success: boolean }>(`/api/v1/notifications/${id}`, { method: 'DELETE' }),

  // Analytics
  analyticsSummary: () =>
    request<{
      smsCountToday: number;
      otpCountToday: number;
      earningsTodayCents: number;
      earnings7dCents: number;
      earnings30dCents: number;
      lifetimeEarningCents: number;
    }>('/api/v1/analytics/summary'),
  analyticsSmsByDay: (q: { from?: string; to?: string }) =>
    request<AnalyticsByDay[]>('/api/v1/analytics/sms-by-day' + buildQuery(q)),
  analyticsEarningsByDay: (q: { from?: string; to?: string }) =>
    request<AnalyticsByDay[]>('/api/v1/analytics/earnings-by-day' + buildQuery(q)),
  analyticsByCountry: (q: { from?: string; to?: string }) =>
    request<CountryOperatorSummary[]>('/api/v1/analytics/sms-by-country' + buildQuery(q)),
  analyticsByOperator: (q: { from?: string; to?: string }) =>
    request<CountryOperatorSummary[]>('/api/v1/analytics/sms-by-operator' + buildQuery(q)),

  // Settings
  profile: () => request<UserProfile>('/api/v1/settings/profile'),
  updateProfile: (data: Partial<UserProfile>) =>
    request<UserProfile>('/api/v1/settings/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updateNotificationPrefs: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/v1/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Ingest
  ingestSms: (data: IngestSmsRequest) =>
    request<IngestSmsResponse>('/api/v1/ingest/sms', { method: 'POST', body: JSON.stringify(data) }),

  // Public
  health: () => request<HealthStatus>('/api/v1/public/health'),
  countries: () => request<Country[]>('/api/v1/public/countries'),
  operators: (country: string) =>
    request<Operator[]>(`/api/v1/public/operators/${country}`),

  // Admin
  admin: {
    users: () =>
      request<Array<User & { tier: string; numberLimit: number }>>('/api/v1/admin/users'),
    userDetail: (id: string) =>
      request<User & { tier: string; numberLimit: number; wallet: WalletBalance }>(
        `/api/v1/admin/users/${id}`
      ),
    updateUser: (id: string, data: Record<string, unknown>) =>
      request<User>(`/api/v1/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    adjustWallet: (userId: string, data: { type: string; amountCents: number; reason: string }) =>
      request<{ success: boolean }>(`/api/v1/admin/wallet/${userId}/adjust`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    rewardRules: (q: Record<string, unknown> = {}) =>
      request<{ data: RewardRule[]; meta: PaginationMeta }>('/api/v1/admin/reward-rules' + buildQuery(q)),
    createRewardRule: (data: Record<string, unknown>) =>
      request<RewardRule>('/api/v1/admin/reward-rules', { method: 'POST', body: JSON.stringify(data) }),
    updateRewardRule: (id: string, data: Record<string, unknown>) =>
      request<RewardRule>(`/api/v1/admin/reward-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRewardRule: (id: string) =>
      request<{ success: boolean }>(`/api/v1/admin/reward-rules/${id}`, { method: 'DELETE' }),
    providers: () => request<Provider[]>('/api/v1/admin/providers'),
    countries: () => request<Country[]>('/api/v1/admin/countries'),
    operators: (q: Record<string, unknown> = {}) =>
      request<{ data: Operator[]; meta: PaginationMeta }>('/api/v1/admin/operators' + buildQuery(q)),
    numbers: (q: Record<string, unknown> = {}) =>
      request<{ data: NumberRecord[]; meta: PaginationMeta }>('/api/v1/admin/numbers' + buildQuery(q)),
    uploadNumbers: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<{ imported: number; errors: string[] }>('/api/v1/admin/numbers/import', {
        method: 'POST',
        body: form as unknown as BodyInit,
      });
    },
    systemStats: () =>
      request<{ totalUsers: number; totalNumbers: number; totalSms: number; totalOtp: number; totalEarningsCents: number; totalRewardsCents: number }>('/api/v1/admin/stats'),
    auditLogs: (q: Record<string, unknown> = {}) =>
      request<{ data: AuditLog[]; meta: PaginationMeta }>('/api/v1/admin/audit-logs' + buildQuery(q)),
    systemLogs: (q: Record<string, unknown> = {}) =>
      request<{ data: SystemLog[]; meta: PaginationMeta }>('/api/v1/admin/system-logs' + buildQuery(q)),
    allWithdrawals: (q: Record<string, unknown> = {}) =>
      request<{ data: WithdrawalRequest[]; meta: PaginationMeta }>('/api/v1/admin/withdrawals' + buildQuery(q)),
    reviewWithdrawal: (id: string, data: { status: string; reason?: string }) =>
      request<WithdrawalRequest>(`/api/v1/admin/withdrawals/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    allWebhooks: () =>
      request<Array<{ id: string; userId: string; url: string; events: string[] }>>('/api/v1/admin/webhooks'),
    allDeliveries: (q: Record<string, unknown> = {}) =>
      request<{ data: WebhookDelivery[]; meta: PaginationMeta }>('/api/v1/admin/webhook-deliveries' + buildQuery(q)),
    systemSettings: () => request<SystemSetting[]>('/api/v1/admin/system-settings'),
    updateSetting: (key: string, data: { value: unknown; description?: string }) =>
      request<SystemSetting>(`/api/v1/admin/system-settings/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
    sendNotification: (data: { type: string; title: string; body: string; userIds?: string[]; data?: Record<string, unknown> }) =>
      request<{ sent: number }>(`/api/v1/admin/notifications/send`, { method: 'POST', body: JSON.stringify(data) }),
  },
} as const;

const fetcher = (url: string) => request<any>(url);

export function useSWRApi<T>(key: string | null, opts?: SWRConfiguration) {
  return useSWR<T>(key, key ? () => request<T>(key) : null, { ...swrOptions, ...opts });
}

export function useAuth() {
  return useSWRApi<User>('/api/v1/auth/me', { revalidateOnMount: true });
}
export function useStats() {
  return useSWRApi<{ totalNumbers: number; totalSms: number; totalVoice: number }>('/api/v1/analytics/summary');
}
export function useEarnings() {
  return useSWRApi<{
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    lifetime: number;
  }>('/api/v1/rewards/summary');
}
export function useNumbers(q: Record<string, unknown> = {}) {
  const qs = buildQuery(q);
  return useSWRApi<{ data: NumberRecord[]; meta: PaginationMeta }>('/api/v1/numbers' + qs);
}
export function useLatestSms() {
  return useSWRApi<SmsMessage | null>('/api/v1/sms/latest');
}
export function useLatestOtp() {
  return useSWRApi<{ code: string; smsId: string } | null>('/api/v1/otp/latest');
}
export function useNotifications() {
  return useSWRApi<{ data: Notification[]; meta: PaginationMeta }>('/api/v1/notifications?limit=20');
}
export function useWithdrawals() {
  return useSWRApi<{ data: WithdrawalRequest[]; meta: PaginationMeta }>('/api/v1/withdrawals?limit=20');
}
export function useWalletBalance() {
  return useSWRApi<{
    pendingCents: number;
    approvedCents: number;
    frozenCents: number;
    lifetimeEarnedCents: number;
    lifetimeWithdrawnCents: number;
  }>('/api/v1/wallet');
}
export function useCountries() {
  return useSWRApi<CountryOperatorSummary[]>('/api/v1/numbers/available');
}
export function useRewardEvents(q: Record<string, unknown> = {}) {
  const qs = buildQuery(q);
  return useSWRApi<{ data: RewardEvent[]; meta: PaginationMeta }>('/api/v1/rewards' + qs);
}
export function useTransactions(q: Record<string, unknown> = {}) {
  const qs = buildQuery(q);
  return useSWRApi<{ data: WalletTransaction[]; meta: PaginationMeta }>('/api/v1/transactions' + qs);
}
export function useAlerts() {
  return useSWRApi<{ status: string } | null>('/api/v1/admin/system-stats');
}

export { fetcher };
