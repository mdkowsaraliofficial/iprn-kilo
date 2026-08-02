import { z } from 'zod';
export const RewardRuleLevelSchema = z.enum([
    'global',
    'per_sms',
    'per_otp',
    'per_country',
    'per_operator',
    'per_provider',
    'per_number',
]);
export const RewardEventStatusSchema = z.enum(['pending', 'approved', 'reversed']);
export const NumberStatusSchema = z.enum(['available', 'assigned', 'suspended', 'expired']);
export const SmsStatusSchema = z.enum(['received', 'processed', 'failed']);
export const WalletTransactionTypeSchema = z.enum([
    'reward',
    'manual_credit',
    'manual_debit',
    'withdrawal',
    'reversal',
    'bonus',
]);
export const WithdrawalStatusSchema = z.enum([
    'pending',
    'processing',
    'approved',
    'rejected',
    'completed',
]);
export const WithdrawalMethodSchema = z.enum(['crypto', 'bank_transfer', 'paypal', 'other']);
export const ProviderTypeSchema = z.enum([
    'manual_pool',
    'http_api',
    'twilio',
    'plivo',
    'signalwire',
]);
export const WebhookEventTypeSchema = z.enum([
    'sms.received',
    'otp.extracted',
    'reward.credited',
    'number.assigned',
    'number.released',
    'withdrawal.approved',
    'withdrawal.rejected',
]);
export const WebhookDeliveryStatusSchema = z.enum(['pending', 'success', 'failed', 'retrying']);
export const NotificationTypeSchema = z.enum(['info', 'warning', 'success', 'error', 'system']);
export const AuditSeveritySchema = z.enum(['info', 'warning', 'critical']);
export const LogCategorySchema = z.enum(['debug', 'info', 'warn', 'error']);
export const LogLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);
export const UserRoleSchema = z.enum(['user', 'admin']);
export const UserStatusSchema = z.enum(['active', 'banned', 'pending']);
export const UserTierSchema = z.enum(['bronze', 'silver', 'gold', 'platinum']);
export const SortDirSchema = z.enum(['asc', 'desc']);
export const SettingCategorySchema = z.enum([
    'general',
    'rewards',
    'numbers',
    'wallet',
    'api',
    'notifications',
    'sms_validation',
    'fraud',
    'providers',
    'analytics',
    'maintenance',
]);
export const ProblemDetailSchema = z.object({
    type: z.string(),
    title: z.string(),
    status: z.number(),
    detail: z.string().optional(),
    instance: z.string().optional(),
    errors: z.record(z.string(), z.array(z.string())).optional(),
});
export const PaginationMetaSchema = z.object({
    cursor: z.string().nullable(),
    nextCursor: z.string().nullable(),
    limit: z.number(),
    total: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
});
export const PaginatedResultSchema = (item) => z.object({
    data: z.array(item),
    meta: PaginationMetaSchema,
});
export const CursorPaginationSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    sortBy: z.string().optional(),
    sortDir: SortDirSchema.optional().default('desc'),
    search: z.string().optional(),
});
export const SortQuerySchema = z.object({
    sortBy: z.string().optional(),
    sortDir: SortDirSchema.optional().default('desc'),
});
export const DateRangeSchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
});
// ---- Auth ----
export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(1).max(100),
});
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    totpCode: z.string().optional(),
});
export const RefreshSchema = z.object({
    refreshToken: z.string().min(1),
});
export const UpdateProfileSchema = z.object({
    displayName: z.string().min(1).max(100).optional(),
    timezone: z.string().optional(),
    notificationPreferences: z.record(z.string(), z.unknown()).optional(),
});
// ---- Numbers ----
export const NumberStatusFilterSchema = z.enum(['all', 'available', 'assigned', 'suspended', 'expired']).optional();
export const NumberListQuerySchema = CursorPaginationSchema.extend({
    status: NumberStatusFilterSchema,
    countryCode: z.string().optional(),
    operator: z.string().optional(),
});
export const NumberRequestSchema = z.object({
    countryCode: z.string().min(2).max(3),
    operator: z.string().min(1),
    preferredPool: z.string().optional(),
    quantity: z.coerce.number().int().min(1).max(10).default(1),
    priority: z.enum(['standard', 'high']).optional().default('standard'),
});
export const NumberResponseSchema = z.object({
    id: z.string(),
    e164: z.string(),
    countryCode: z.string(),
    operator: z.string(),
    providerId: z.string(),
    status: NumberStatusSchema,
    qualityScore: z.number(),
    notes: z.string().nullable(),
    lastSmsAt: z.string().nullable(),
    createdAt: z.string(),
    assignedUserId: z.string().nullable(),
});
export const NumberAssignmentResponseSchema = z.object({
    id: z.string(),
    numberId: z.string(),
    userId: z.string(),
    assignedAt: z.string(),
    releasedAt: z.string().nullable(),
    status: z.enum(['active', 'released']),
});
export const CountryOperatorSummarySchema = z.object({
    countryCode: z.string(),
    countryName: z.string(),
    available: z.number(),
    assigned: z.number(),
    total: z.number(),
});
export const CountryResponseSchema = z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    active: z.boolean(),
    baseRewardMultiplier: z.number(),
});
export const OperatorResponseSchema = z.object({
    id: z.string(),
    countryCode: z.string(),
    name: z.string(),
    active: z.boolean(),
    rewardMultiplier: z.number(),
});
// ---- SMS ----
export const SmsResponseSchema = z.object({
    id: z.string(),
    numberId: z.string(),
    userId: z.string(),
    sender: z.string(),
    body: z.string(),
    extractedOtp: z.string().nullable(),
    country: z.string(),
    operator: z.string(),
    providerId: z.string(),
    status: SmsStatusSchema,
    rewardEventId: z.string().nullable(),
    createdAt: z.string(),
});
export const SmsListQuerySchema = CursorPaginationSchema.extend({
    numberId: z.string().optional(),
    country: z.string().optional(),
    operator: z.string().optional(),
    status: z.enum(['all', 'received', 'processed', 'failed']).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
});
// ---- OTP ----
export const OtpResponseSchema = z.object({
    id: z.string(),
    smsId: z.string(),
    numberId: z.string(),
    userId: z.string(),
    code: z.string(),
    extractedAt: z.string(),
});
export const OtpListQuerySchema = CursorPaginationSchema.extend({
    numberId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
});
// ---- Wallet ----
export const WalletBalanceSchema = z.object({
    userId: z.string(),
    pendingCents: z.number(),
    approvedCents: z.number(),
    frozenCents: z.number(),
    lifetimeEarnedCents: z.number(),
    lifetimeWithdrawnCents: z.number(),
    updatedAt: z.string(),
});
export const WalletTransactionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    type: WalletTransactionTypeSchema,
    amountCents: z.number(),
    balanceAfterCents: z.number(),
    sourceType: z.string().nullable(),
    sourceId: z.string().nullable(),
    performedByUserId: z.string().nullable(),
    reason: z.string().nullable(),
    createdAt: z.string(),
});
export const WalletTransactionsQuerySchema = CursorPaginationSchema.extend({
    type: WalletTransactionTypeSchema.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
});
// ---- Rewards ----
export const RewardEventSchema = z.object({
    id: z.string(),
    smsId: z.string(),
    userId: z.string(),
    ruleId: z.string(),
    baseAmountCents: z.number(),
    countryMultiplier: z.number(),
    operatorMultiplier: z.number(),
    userTierMultiplier: z.number(),
    finalAmountCents: z.number(),
    status: RewardEventStatusSchema,
    createdAt: z.string(),
});
export const RewardEventDetailSchema = RewardEventSchema.extend({
    rule: z.object({
        id: z.string(),
        level: RewardRuleLevelSchema,
        target: z.string().nullable(),
        baseAmountCents: z.number(),
        multiplier: z.number(),
    }),
});
export const RewardListQuerySchema = CursorPaginationSchema.extend({
    status: RewardEventStatusSchema.optional(),
    country: z.string().optional(),
    operator: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
});
export const RewardSummarySchema = z.object({
    today: z.number(),
    yesterday: z.number(),
    last7Days: z.number(),
    last30Days: z.number(),
    lifetime: z.number(),
});
// ---- Withdrawals ----
export const WithdrawalRequestSchema = z.object({
    method: WithdrawalMethodSchema,
    address: z.string().min(1),
    amountCents: z.number().int().min(100),
});
export const WithdrawalResponseSchema = z.object({
    id: z.string(),
    userId: z.string(),
    amountCents: z.number(),
    method: WithdrawalMethodSchema,
    address: z.string(),
    status: WithdrawalStatusSchema,
    reviewedBy: z.string().nullable(),
    reason: z.string().nullable(),
    createdAt: z.string(),
    processedAt: z.string().nullable(),
});
export const WithdrawalListQuerySchema = CursorPaginationSchema.extend({
    status: WithdrawalStatusSchema.optional(),
});
// ---- API Keys ----
export const ApiKeyResponseSchema = z.object({
    id: z.string(),
    userId: z.string(),
    keyPrefix: z.string(),
    webhookUrl: z.string().nullable(),
    webhookEvents: z.array(WebhookEventTypeSchema),
    permissions: z.array(z.string()),
    rateLimitOverride: z.number().nullable(),
    lastUsedAt: z.string().nullable(),
    createdAt: z.string(),
});
export const ApiKeyCreateSchema = z.object({
    name: z.string().min(1).max(100),
    permissions: z.array(z.string()).optional(),
    rateLimitOverride: z.number().int().positive().nullable().optional(),
    webhookUrl: z.string().url().nullable().optional(),
    webhookEvents: z.array(WebhookEventTypeSchema).optional(),
});
export const ApiKeyCreateResponseSchema = z.object({
    id: z.string(),
    keyId: z.string(),
    keyPrefix: z.string(),
    secret: z.string(),
    createdAt: z.string(),
});
export const ApiKeyRotateResponseSchema = z.object({
    id: z.string(),
    keyPrefix: z.string(),
    secret: z.string(),
});
export const ApiKeyUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    webhookUrl: z.string().url().nullable().optional(),
    webhookEvents: z.array(WebhookEventTypeSchema).optional(),
    permissions: z.array(z.string()).optional(),
    rateLimitOverride: z.number().int().positive().nullable().optional(),
});
export const ApiKeyUsageSchema = z.object({
    totalRequests: z.number(),
    requestsToday: z.number(),
    topEndpoints: z.array(z.object({ endpoint: z.string(), count: z.number() })),
});
// ---- Webhooks ----
export const WebhookResponseSchema = z.object({
    id: z.string(),
    userId: z.string(),
    url: z.string(),
    events: z.array(WebhookEventTypeSchema),
    secret: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const WebhookCreateSchema = z.object({
    url: z.string().url(),
    events: z.array(WebhookEventTypeSchema).min(1),
    secret: z.string().min(8).default(() => cryptoRandomString(32)),
});
export const WebhookDeliverySchema = z.object({
    id: z.string(),
    userId: z.string(),
    apiKeyId: z.string().nullable(),
    eventType: WebhookEventTypeSchema,
    url: z.string(),
    status: WebhookDeliveryStatusSchema,
    attempts: z.number(),
    lastAttemptAt: z.string().nullable(),
    responseStatus: z.number().nullable(),
    responseBody: z.string().nullable(),
    createdAt: z.string(),
});
// ---- Notifications ----
export const NotificationSchema = z.object({
    id: z.string(),
    userId: z.string(),
    type: NotificationTypeSchema,
    title: z.string(),
    body: z.string(),
    read: z.boolean(),
    data: z.record(z.string(), z.unknown()),
    createdAt: z.string(),
});
export const NotificationListQuerySchema = CursorPaginationSchema.extend({
    unreadOnly: z.coerce.boolean().optional(),
});
// ---- Analytics ----
export const AnalyticsSummarySchema = z.object({
    smsCountToday: z.number(),
    otpCountToday: z.number(),
    earningsTodayCents: z.number(),
    earnings7dCents: z.number(),
    earnings30dCents: z.number(),
    lifetimeEarningCents: z.number(),
});
export const AnalyticsByDaySchema = z.object({
    date: z.string(),
    smsCount: z.number(),
    otpCount: z.number(),
    earningsCents: z.number(),
});
export const AnalyticsByCountrySchema = z.object({
    countryCode: z.string(),
    countryName: z.string(),
    smsCount: z.number(),
    earningsCents: z.number(),
});
export const AnalyticsByOperatorSchema = z.object({
    operator: z.string(),
    countryCode: z.string(),
    smsCount: z.number(),
    earningsCents: z.number(),
});
// ---- Ingest ----
export const IngestSmsSchema = z.object({
    phoneNumber: z.string().min(5),
    sender: z.string().min(1),
    message: z.string().min(1),
    providerId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const IngestSmsResponseSchema = z.object({
    smsId: z.string(),
    rewardAmountCents: z.number(),
    otp: z.string().nullable(),
    processed: z.boolean(),
});
// ---- Reward Rules (admin) ----
export const RewardRuleSchema = z.object({
    id: z.string(),
    level: RewardRuleLevelSchema,
    target: z.string().nullable(),
    baseAmountCents: z.number(),
    multiplier: z.number(),
    priority: z.number(),
    active: z.boolean(),
    validFrom: z.string().nullable(),
    validTo: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const RewardRuleCreateSchema = z.object({
    level: RewardRuleLevelSchema,
    target: z.string().nullable(),
    baseAmountCents: z.number().int().min(0),
    multiplier: z.number().positive(),
    priority: z.number().int(),
    active: z.boolean().default(true),
    validFrom: z.string().nullable().optional(),
    validTo: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});
export const RewardRuleUpdateSchema = RewardRuleCreateSchema.partial();
// ---- Providers (admin) ----
export const ProviderSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    type: ProviderTypeSchema,
    config: z.record(z.string(), z.unknown()),
    status: z.enum(['active', 'inactive', 'degraded']),
    healthScore: z.number(),
    lastCheckedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const ProviderCreateSchema = z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(100),
    type: ProviderTypeSchema,
    config: z.record(z.string(), z.unknown()).default({}),
    status: z.enum(['active', 'inactive', 'degraded']).default('active'),
});
export const ProviderUpdateSchema = ProviderCreateSchema.partial();
// ---- Users (admin) ----
export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    displayName: z.string(),
    status: UserStatusSchema,
    role: UserRoleSchema,
    numberLimitOverride: z.number().nullable(),
    apiEnabled: z.boolean(),
    createdAt: z.string(),
    tier: UserTierSchema.optional(),
});
export const UserUpdateSchema = z.object({
    displayName: z.string().min(1).max(100).optional(),
    status: UserStatusSchema.optional(),
    role: UserRoleSchema.optional(),
    numberLimitOverride: z.number().int().positive().nullable().optional(),
    apiEnabled: z.boolean().optional(),
    tier: UserTierSchema.optional(),
});
// ---- Wallet Admin ----
export const WalletAdjustmentSchema = z.object({
    type: z.enum(['manual_credit', 'manual_debit']),
    amountCents: z.number().int(),
    reason: z.string().min(1),
});
// ---- System Settings (admin) ----
export const SystemSettingSchema = z.object({
    key: z.string(),
    value: z.unknown(),
    description: z.string(),
    category: SettingCategorySchema,
    updatedBy: z.string().nullable(),
    updatedAt: z.string(),
});
export const SystemSettingUpdateSchema = z.object({
    value: z.unknown(),
    description: z.string().optional(),
    category: SettingCategorySchema.optional(),
});
// ---- Health ----
export const HealthStatusSchema = z.object({
    status: z.enum(['healthy', 'degraded', 'down']),
    timestamp: z.string(),
    components: z.array(z.object({
        name: z.string(),
        status: z.enum(['healthy', 'degraded', 'down']),
        latencyMs: z.number().nullable(),
        detail: z.string().nullable(),
    })),
    version: z.string(),
});
export const AuditLogSchema = z.object({
    id: z.string(),
    userId: z.string().nullable(),
    action: z.string(),
    resourceType: z.string(),
    resourceId: z.string().nullable(),
    changes: z.record(z.string(), z.unknown()).nullable(),
    ip: z.string().nullable(),
    userAgent: z.string().nullable(),
    severity: AuditSeveritySchema,
    createdAt: z.string(),
});
export const SystemLogSchema = z.object({
    id: z.string(),
    level: LogLevelSchema,
    category: z.string(),
    message: z.string(),
    context: z.record(z.string(), z.unknown()).nullable(),
    createdAt: z.string(),
});
// ---- User Profile ----
export const UserProfileSchema = z.object({
    userId: z.string(),
    displayName: z.string(),
    email: z.string().email(),
    timezone: z.string(),
    notificationPreferences: z.record(z.string(), z.unknown()),
    numberLimit: z.number(),
    apiEnabled: z.boolean(),
});
// ---- Orders ----
export const OrderSchema = z.object({
    id: z.string(),
    userId: z.string(),
    numberId: z.string().nullable(),
    type: z.enum(['number_purchase', 'subscription']),
    status: z.enum(['pending', 'completed', 'cancelled', 'refunded']),
    amountCents: z.number(),
    createdAt: z.string(),
});
export const NumberResponseArraySchema = z.array(NumberResponseSchema);
function cryptoRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        const idx = array[i] ?? 0;
        result += chars[idx % chars.length];
    }
    return result;
}
//# sourceMappingURL=index.js.map