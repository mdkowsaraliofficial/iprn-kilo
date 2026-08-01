import useSWR, { type SWRConfiguration } from 'swr';
import type {
  NumberRecord,
  CountryOperatorSummary,
  Country,
  Operator,
  SmsMessage,
  RewardEvent,
  RewardRule,
  WalletTransaction,
  WithdrawalRequest,
  WithdrawalStatus,
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
  AnalyticsSummary,
  RewardSummary,
  RewardDetail,
  WithdrawalSubmitResult,
  AdminUser,
  AdminUserDetail,
  AdminStats,
  AdminDelivery,
  IngestSmsRequest,
  IngestSmsResponse,
  WebhookConfigInput,
  WithdrawalMethod,
  WalletTransactionType,
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

const SSE_EVENT_TYPES: AnySseEvent['type'][] = [
  'sms.received',
  'otp.extracted',
  'reward.credited',
  'wallet.updated',
  'number.assigned',
  'number.released',
  'notification.new',
  'withdrawal.status',
];

export function createSseStream(
  eventPath: string,
  onEvent: (event: AnySseEvent) => void,
  onError?: (err: Event) => void
): EventSource {
  const source = new EventSource(`${_config.baseUrl}${eventPath}`);

  // The worker broadcasts named SSE events (e.g. `event: sms.received`), so
  // `onmessage` never fires. Listen on each event type and attach the
  // discriminant `type` to the parsed payload.
  const dispatch = (type: AnySseEvent['type']) => (e: MessageEvent) => {
    try {
      const payload = JSON.parse(e.data) as Record<string, unknown>;
      onEvent({ type, ...payload } as AnySseEvent);
    } catch {
      // non-json keepalive
    }
  };

  for (const t of SSE_EVENT_TYPES) {
    source.addEventListener(t, dispatch(t) as EventListener);
  }

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
  me: () => request<UserProfile>('/v1/auth/me'),
  updateProfile: (data: { displayName?: string; email?: string; timezone?: string; notificationPreferences?: Record<string, unknown> }) =>
    request<{ success: boolean }>('/v1/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<{ accessToken: string; refreshToken: string; user: UserProfile }>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: { email: string; password: string; displayName: string }) =>
    request<{ accessToken: string; refreshToken: string; user: UserProfile }>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () => request<{ success: boolean }>('/v1/auth/logout', { method: 'POST' }),

  // Numbers
  listNumbers: (q: Record<string, unknown> = {}) =>
    request<{ data: NumberRecord[]; meta: PaginationMeta }>('/v1/numbers' + buildQuery(q)),
  availableNumbers: () => request<CountryOperatorSummary[]>('/v1/numbers/available'),
  requestNumber: (data: { countryCode: string; operator: string; quantity?: number }) =>
    request<{ message: string; assigned: NumberRecord[] }>(
      '/v1/numbers/request',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  numberDetail: (id: string) => request<NumberRecord>(`/v1/numbers/${id}`),
  releaseNumber: (id: string) =>
    request<{ success: boolean }>(`/v1/numbers/${id}/release`, { method: 'DELETE' }),

  // SMS
  listSms: (q: Record<string, unknown> = {}) =>
    request<{ data: SmsMessage[]; meta: PaginationMeta }>('/v1/sms' + buildQuery(q)),
  latestSms: () => request<SmsMessage | null>('/v1/sms/latest'),
  smsDetail: (id: string) => request<SmsMessage>(`/v1/sms/${id}`),
  smsByNumber: (numberId: string, q: Record<string, unknown> = {}) =>
    request<{ data: SmsMessage[]; meta: PaginationMeta }>(
      `/v1/sms/by-number/${numberId}` + buildQuery(q)
    ),

  // OTP
  latestOtp: () => request<{ code: string; smsId: string } | null>('/v1/otp/latest'),
  otpHistory: (q: Record<string, unknown> = {}) =>
    request<{ data: { code: string; smsId: string; numberId: string; createdAt: string }[]; meta: PaginationMeta }>(
      '/v1/otp/history' + buildQuery(q)
    ),
  otpByNumber: (numberId: string) =>
    request<{ code: string; smsId: string; createdAt: string } | null>(
      `/v1/otp/by-number/${numberId}`
    ),

  // Wallet
  walletBalance: () =>
    request<{
      pendingCents: number;
      approvedCents: number;
      frozenCents: number;
      lifetimeEarnedCents: number;
      lifetimeWithdrawnCents: number;
      withdrawableCents: number;
      updatedAt: string;
    }>('/v1/wallet'),
  walletTransactions: (q: Record<string, unknown> = {}) =>
    request<{ data: WalletTransaction[]; meta: PaginationMeta }>('/v1/wallet/transactions' + buildQuery(q)),

  // Rewards
  rewardEvents: (q: Record<string, unknown> = {}) =>
    request<{ data: RewardEvent[]; meta: PaginationMeta }>('/v1/rewards' + buildQuery(q)),
  rewardSummary: () =>
    request<RewardSummary>('/v1/rewards/summary'),
  rewardDetail: (id: string) =>
    request<RewardDetail>(`/v1/rewards/${id}`),

  // Transactions
  transactions: (q: Record<string, unknown> = {}) =>
    request<{ data: WalletTransaction[]; meta: PaginationMeta }>('/v1/transactions' + buildQuery(q)),

  // Withdrawals
  createWithdrawal: (data: { method: WithdrawalMethod; address: string; amountCents: number }) =>
    request<WithdrawalSubmitResult>('/v1/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listWithdrawals: (q: Record<string, unknown> = {}) =>
    request<{ data: WithdrawalRequest[]; meta: PaginationMeta }>('/v1/withdrawals' + buildQuery(q)),
  withdrawalDetail: (id: string) => request<WithdrawalRequest>(`/v1/withdrawals/${id}`),

  // Webhooks
  listWebhooks: () =>
    request<Array<WebhookConfigInput & { id: string; createdAt: string }>>('/v1/webhooks'),
  createWebhook: (data: WebhookConfigInput) =>
    request<{ id: string; url: string; events: string[]; secret: string }>(
      '/v1/webhooks',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  updateWebhook: (id: string, data: Partial<WebhookConfigInput>) =>
    request<{ id: string; url: string; events: string[] }>(
      `/v1/webhooks/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),
  deleteWebhook: (id: string) =>
    request<{ success: boolean }>(`/v1/webhooks/${id}`, { method: 'DELETE' }),
  webhookDeliveries: (id: string, q: Record<string, unknown> = {}) =>
    request<{ data: WebhookDelivery[]; meta: PaginationMeta }>(
      `/v1/webhooks/${id}/deliveries` + buildQuery(q)
    ),
  testWebhook: (id: string) =>
    request<{ status: string }>(`/v1/webhooks/${id}/test`, { method: 'POST' }),

  // API Keys
  listApiKeys: () =>
    request<Array<ApiKey & { keyPrefixDisplay: string }>>('/v1/api-keys'),
  createApiKey: (data: { name: string; permissions?: string[] }) =>
    request<{ id: string; keyId: string; keyPrefix: string; secret: string }>(
      '/v1/api-keys',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  deleteApiKey: (id: string) =>
    request<{ success: boolean }>(`/v1/api-keys/${id}`, { method: 'DELETE' }),
  rotateApiKey: (id: string) =>
    request<{ id: string; keyPrefix: string; secret: string }>(
      `/v1/api-keys/${id}/rotate`,
      { method: 'POST' }
    ),
  apiKeyUsage: (id: string) =>
    request<{ totalRequests: number; requestsToday: number; topEndpoints: Array<{ endpoint: string; count: number }> }>(
      `/v1/api-keys/${id}/usage`
    ),
  apiKeyLogs: (id: string, q: Record<string, unknown> = {}) =>
    request<{ data: Array<{ endpoint: string; method: string; statusCode: number; responseTimeMs: number; createdAt: string }>; meta: PaginationMeta }>(
      `/v1/api-keys/${id}/logs` + buildQuery(q)
    ),

  // Notifications
  listNotifications: (q: Record<string, unknown> = {}) =>
    request<{ data: Notification[]; meta: PaginationMeta }>('/v1/notifications' + buildQuery(q)),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/v1/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/v1/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id: string) =>
    request<{ success: boolean }>(`/v1/notifications/${id}`, { method: 'DELETE' }),

  // Analytics
  analyticsSummary: () =>
    request<AnalyticsSummary>('/v1/analytics/summary'),
  analyticsSmsByDay: (q: { from?: string; to?: string }) =>
    request<AnalyticsByDay[]>('/v1/analytics/sms-by-day' + buildQuery(q)),
  analyticsEarningsByDay: (q: { from?: string; to?: string }) =>
    request<AnalyticsByDay[]>('/v1/analytics/earnings-by-day' + buildQuery(q)),
  analyticsByCountry: (q: { from?: string; to?: string }) =>
    request<CountryOperatorSummary[]>('/v1/analytics/sms-by-country' + buildQuery(q)),
  analyticsByOperator: (q: { from?: string; to?: string }) =>
    request<CountryOperatorSummary[]>('/v1/analytics/sms-by-operator' + buildQuery(q)),

  // Settings
  settings: {
    profile: () => request<UserProfile>('/v1/settings/profile'),
    updateProfile: (data: Partial<UserProfile>) =>
      request<UserProfile>('/v1/settings/profile', { method: 'PUT', body: JSON.stringify(data) }),
    updateNotificationPrefs: (data: Record<string, unknown>) =>
      request<Record<string, unknown>>('/v1/settings/notifications', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Ingest
  ingestSms: (data: IngestSmsRequest) =>
    request<IngestSmsResponse>('/v1/ingest/sms', { method: 'POST', body: JSON.stringify(data) }),

  // Public
  health: () => request<HealthStatus>('/v1/public/health'),
  countries: () => request<Country[]>('/v1/public/countries'),
  operators: (country: string) =>
    request<Operator[]>(`/v1/public/operators/${country}`),

  // Admin
  admin: {
    users: () =>
      request<AdminUser[]>('/v1/admin/users'),
    userDetail: (id: string) =>
      request<AdminUserDetail>(
        `/v1/admin/users/${id}`
      ),
    updateUser: (id: string, data: Record<string, unknown>) =>
      request<{ success: boolean }>(`/v1/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    adjustWallet: (userId: string, data: { type: WalletTransactionType; amountCents: number; reason: string }) =>
      request<{ success: boolean; balanceAfterCents: number; approvedCents: number }>(`/v1/admin/wallet/${userId}/adjust`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    rewardRules: (q: Record<string, unknown> = {}) =>
      request<RewardRule[]>('/v1/admin/reward-rules' + buildQuery(q)),
    createRewardRule: (data: Record<string, unknown>) =>
      request<{ id: string } & Record<string, unknown>>('/v1/admin/reward-rules', { method: 'POST', body: JSON.stringify(data) }),
    updateRewardRule: (id: string, data: Record<string, unknown>) =>
      request<{ success: boolean }>(`/v1/admin/reward-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRewardRule: (id: string) =>
      request<{ success: boolean }>(`/v1/admin/reward-rules/${id}`, { method: 'DELETE' }),
    providers: () => request<Provider[]>('/v1/admin/providers'),
    countries: () => request<Country[]>('/v1/admin/countries'),
    operators: (q: Record<string, unknown> = {}) =>
      request<Operator[]>('/v1/admin/operators' + buildQuery(q)),
    numbers: (q: Record<string, unknown> = {}) =>
      request<NumberRecord[]>('/v1/admin/numbers' + buildQuery(q)),
    uploadNumbers: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<{ imported: number; errors: string[] }>('/v1/admin/numbers/import', {
        method: 'POST',
        body: form as unknown as BodyInit,
      });
    },
    systemStats: () =>
      request<AdminStats>('/v1/admin/stats'),
    auditLogs: (q: Record<string, unknown> = {}) =>
      request<AuditLog[]>('/v1/admin/audit-logs' + buildQuery(q)),
    systemLogs: (q: Record<string, unknown> = {}) =>
      request<SystemLog[]>('/v1/admin/system-logs' + buildQuery(q)),
    allWithdrawals: (q: Record<string, unknown> = {}) =>
      request<WithdrawalRequest[]>('/v1/admin/withdrawals' + buildQuery(q)),
    reviewWithdrawal: (id: string, data: { status: WithdrawalStatus; reason?: string }) =>
      request<WithdrawalRequest>(`/v1/admin/withdrawals/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    allWebhooks: () =>
      request<Array<{ id: string; userId: string; url: string; events: string[] }>>('/v1/admin/webhooks'),
    allDeliveries: (q: Record<string, unknown> = {}) =>
      request<AdminDelivery[]>('/v1/admin/webhook-deliveries' + buildQuery(q)),
    systemSettings: () => request<SystemSetting[]>('/v1/admin/system-settings'),
    updateSetting: (key: string, data: { value: unknown; description?: string }) =>
      request<{ success: boolean }>(`/v1/admin/system-settings/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
    sendNotification: (data: { type: string; title: string; body: string; userIds?: string[]; data?: Record<string, unknown> }) =>
      request<{ sent: number }>(`/v1/admin/notifications/send`, { method: 'POST', body: JSON.stringify(data) }),
  },
} as const;

const fetcher = (url: string) => request<any>(url);

export function useSWRApi<T>(key: string | null, opts?: SWRConfiguration) {
  return useSWR<T>(key, key ? () => request<T>(key) : null, { ...swrOptions, ...opts });
}

export function useAuth() {
  return useSWRApi<UserProfile>('/v1/auth/me', { revalidateOnMount: true });
}
export function useStats() {
  return useSWRApi<AnalyticsSummary>('/v1/analytics/summary');
}
export function useEarnings() {
  return useSWRApi<RewardSummary>('/v1/rewards/summary');
}
export function useNumbers(q: Record<string, unknown> = {}) {
  const qs = buildQuery(q);
  return useSWRApi<{ data: NumberRecord[]; meta: PaginationMeta }>('/v1/numbers' + qs);
}
export function useLatestSms() {
  return useSWRApi<SmsMessage | null>('/v1/sms/latest');
}
export function useLatestOtp() {
  return useSWRApi<{ code: string; smsId: string } | null>('/v1/otp/latest');
}
export function useNotifications() {
  return useSWRApi<{ data: Notification[]; meta: PaginationMeta }>('/v1/notifications?limit=20');
}
export function useWithdrawals() {
  return useSWRApi<{ data: WithdrawalRequest[]; meta: PaginationMeta }>('/v1/withdrawals?limit=20');
}
export function useWalletBalance() {
  return useSWRApi<{
    pendingCents: number;
    approvedCents: number;
    frozenCents: number;
    lifetimeEarnedCents: number;
    lifetimeWithdrawnCents: number;
    withdrawableCents: number;
    updatedAt: string;
  }>('/v1/wallet');
}
export function useCountries() {
  return useSWRApi<CountryOperatorSummary[]>('/v1/numbers/available');
}
export function useRewardEvents(q: Record<string, unknown> = {}) {
  const qs = buildQuery(q);
  return useSWRApi<{ data: RewardEvent[]; meta: PaginationMeta }>('/v1/rewards' + qs);
}
export function useTransactions(q: Record<string, unknown> = {}) {
  const qs = buildQuery(q);
  return useSWRApi<{ data: WalletTransaction[]; meta: PaginationMeta }>('/v1/transactions' + qs);
}
export function useAlerts() {
  return useSWRApi<AdminStats>('/v1/admin/stats');
}

export { fetcher };
