export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'banned' | 'pending';
export interface User {
    id: string;
    email: string;
    displayName: string;
    status: UserStatus;
    role: UserRole;
    numberLimitOverride: number | null;
    apiEnabled: boolean;
    createdAt: string;
}
export type UserTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export declare const USER_TIER_MULTIPLIERS: Record<UserTier, number>;
export type NumberStatus = 'available' | 'assigned' | 'suspended' | 'expired';
export interface NumberRecord {
    id: string;
    e164: string;
    countryCode: string;
    operator: string;
    providerId: string;
    status: NumberStatus;
    qualityScore: number;
    notes: string | null;
    lastSmsAt: string | null;
    createdAt: string;
    assignedUserId: string | null;
}
export interface NumberAssignment {
    id: string;
    numberId: string;
    userId: string;
    assignedAt: string;
    releasedAt: string | null;
    status: 'active' | 'released';
}
export type SmsStatus = 'received' | 'processed' | 'failed';
export interface SmsMessage {
    id: string;
    numberId: string;
    userId: string;
    sender: string;
    body: string;
    extractedOtp: string | null;
    country: string;
    operator: string;
    providerId: string;
    status: SmsStatus;
    rewardEventId: string | null;
    createdAt: string;
}
export type RewardRuleLevel = 'global' | 'per_sms' | 'per_otp' | 'per_country' | 'per_operator' | 'per_provider' | 'per_number';
export interface RewardRule {
    id: string;
    level: RewardRuleLevel;
    target: string | null;
    baseAmountCents: number;
    multiplier: number;
    priority: number;
    active: boolean;
    validFrom: string | null;
    validTo: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}
export type RewardEventStatus = 'pending' | 'approved' | 'reversed';
export interface RewardEvent {
    id: string;
    smsId: string;
    userId: string;
    ruleId: string;
    baseAmountCents: number;
    countryMultiplier: number;
    operatorMultiplier: number;
    userTierMultiplier: number;
    finalAmountCents: number;
    status: RewardEventStatus;
    createdAt: string;
}
export interface WalletBalance {
    userId: string;
    pendingCents: number;
    approvedCents: number;
    frozenCents: number;
    lifetimeEarnedCents: number;
    lifetimeWithdrawnCents: number;
    updatedAt: string;
}
export type WalletTransactionType = 'reward' | 'manual_credit' | 'manual_debit' | 'withdrawal' | 'reversal' | 'bonus';
export interface WalletTransaction {
    id: string;
    userId: string;
    type: WalletTransactionType;
    amountCents: number;
    balanceAfterCents: number;
    sourceType: string | null;
    sourceId: string | null;
    performedByUserId: string | null;
    reason: string | null;
    createdAt: string;
}
export type WithdrawalStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'completed';
export type WithdrawalMethod = 'crypto' | 'bank_transfer' | 'paypal' | 'other';
export interface WithdrawalRequest {
    id: string;
    userId: string;
    amountCents: number;
    method: WithdrawalMethod;
    address: string;
    status: WithdrawalStatus;
    reviewedBy: string | null;
    reason: string | null;
    createdAt: string;
    processedAt: string | null;
}
export interface Order {
    id: string;
    userId: string;
    numberId: string | null;
    type: 'number_purchase' | 'subscription';
    status: 'pending' | 'completed' | 'cancelled' | 'refunded';
    amountCents: number;
    createdAt: string;
}
export type ProviderType = 'manual_pool' | 'http_api' | 'twilio' | 'plivo' | 'signalwire';
export interface Provider {
    id: string;
    name: string;
    slug: string;
    type: ProviderType;
    config: Record<string, unknown>;
    status: 'active' | 'inactive' | 'degraded';
    healthScore: number;
    lastCheckedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface Country {
    id: string;
    code: string;
    name: string;
    active: boolean;
    baseRewardMultiplier: number;
}
export interface Operator {
    id: string;
    countryCode: string;
    name: string;
    active: boolean;
    rewardMultiplier: number;
}
export interface ApiKey {
    id: string;
    userId: string;
    keyHash: string;
    keyPrefix: string;
    secretHash: string;
    webhookUrl: string | null;
    webhookEvents: string[];
    permissions: string[];
    rateLimitOverride: number | null;
    lastUsedAt: string | null;
    createdAt: string;
}
export interface ApiUsageLog {
    id: string;
    apiKeyId: string;
    userId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTimeMs: number;
    ip: string;
    createdAt: string;
}
export type WebhookEventType = 'sms.received' | 'otp.extracted' | 'reward.credited' | 'number.assigned' | 'number.released' | 'withdrawal.approved' | 'withdrawal.rejected';
export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';
export interface WebhookDelivery {
    id: string;
    userId: string;
    apiKeyId: string | null;
    eventType: WebhookEventType;
    payloadHash: string;
    url: string;
    status: WebhookDeliveryStatus;
    attempts: number;
    lastAttemptAt: string | null;
    nextRetryAt: string | null;
    responseStatus: number | null;
    responseBody: string | null;
    createdAt: string;
}
export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'system';
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    read: boolean;
    data: Record<string, unknown>;
    createdAt: string;
}
export interface SystemSetting {
    key: string;
    value: unknown;
    description: string;
    category: string;
    updatedBy: string | null;
    updatedAt: string;
}
export interface SseEvent {
    id: number;
    userId: string;
    eventType: string;
    payload: Record<string, unknown>;
    createdAt: string;
}
export interface AnalyticsHour {
    bucketHour: string;
    countryCode: string | null;
    operator: string | null;
    providerId: string | null;
    smsCount: number;
    otpCount: number;
    rewardTotalCents: number;
    uniqueUsers: number;
}
export interface AnalyticsDay {
    bucketDay: string;
    countryCode: string | null;
    operator: string | null;
    providerId: string | null;
    smsCount: number;
    otpCount: number;
    rewardTotalCents: number;
    uniqueUsers: number;
    newUsers: number;
}
export interface ProviderHealthLog {
    id: string;
    providerId: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTimeMs: number | null;
    errorMessage: string | null;
    checkedAt: string;
}
export type AuditSeverity = 'info' | 'warning' | 'critical';
export interface AuditLog {
    id: string;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    changes: Record<string, unknown> | null;
    ip: string | null;
    userAgent: string | null;
    severity: AuditSeverity;
    createdAt: string;
}
export interface SystemLog {
    id: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    category: string;
    message: string;
    context: Record<string, unknown> | null;
    createdAt: string;
}
export interface PaginationMeta {
    cursor: string | null;
    nextCursor: string | null;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}
export interface SortConfig {
    sortBy: string | null;
    sortDir: 'asc' | 'desc';
}
export type ProblemDetail = {
    type: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
    errors?: Record<string, string[]>;
};
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}
export interface HealthComponent {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latencyMs: number | null;
    detail: string | null;
}
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'down';
    timestamp: string;
    components: HealthComponent[];
    version: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export interface RegisterCredentials {
    email: string;
    password: string;
    displayName: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
    totpCode?: string;
}
export interface UserProfile {
    userId: string;
    displayName: string;
    email: string;
    timezone: string;
    notificationPreferences: Record<string, unknown>;
    numberLimit: number;
    apiEnabled: boolean;
}
export type SettingCategory = 'general' | 'rewards' | 'numbers' | 'wallet' | 'api' | 'notifications' | 'sms_validation' | 'fraud' | 'providers' | 'analytics' | 'maintenance';
export type WebhookEventFilter = WebhookEventType;
export interface WebhookConfigInput {
    url: string;
    events: WebhookEventFilter[];
    secret?: string;
}
export interface ApiKeyCreateResponse {
    id: string;
    keyId: string;
    keyPrefix: string;
    secret: string;
    createdAt: string;
}
export interface ApiKeyRotateResponse {
    id: string;
    keyPrefix: string;
    secret: string;
}
export interface WithdrawalRequestInput {
    method: WithdrawalMethod;
    address: string;
    amountCents: number;
}
export interface CountryOperatorSummary {
    countryCode: string;
    countryName: string;
    available: number;
    assigned: number;
    total: number;
}
export interface NumberRequestInput {
    countryCode: string;
    operator: string;
    preferredPool?: string;
    quantity: number;
    priority?: 'standard' | 'high';
}
export interface IngestSmsRequest {
    phoneNumber: string;
    sender: string;
    message: string;
    providerId?: string;
    metadata?: Record<string, unknown>;
}
export interface IngestSmsResponse {
    smsId: string;
    rewardAmountCents: number;
    otp: string | null;
    processed: boolean;
}
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = string;
export interface SmsReceivedEvent {
    smsId: string;
    numberId: string;
    userId: string;
    sender: string;
    body: string;
    otp: string | null;
    country: string;
    operator: string;
    providerId: string;
    createdAt: string;
}
export interface OtpExtractedEvent {
    smsId: string;
    userId: string;
    numberId: string;
    otp: string;
    extractedAt: string;
}
export interface RewardCreditedEvent {
    smsId: string;
    userId: string;
    rewardEventId: string;
    amountCents: number;
    currency: string;
    createdAt: string;
}
export interface NumberAssignedEvent {
    userId: string;
    numberId: string;
    e164: string;
    countryCode: string;
    operator: string;
    assignedAt: string;
}
export interface NumberReleasedEvent {
    userId: string;
    numberId: string;
    e164: string;
    releasedAt: string;
}
export interface WithdrawalStatusEvent {
    userId: string;
    withdrawalId: string;
    status: WithdrawalStatus;
    amountCents: number;
}
export type PlatformEvent = ({
    type: 'sms.received';
} & SmsReceivedEvent) | ({
    type: 'otp.extracted';
} & OtpExtractedEvent) | ({
    type: 'reward.credited';
} & RewardCreditedEvent) | ({
    type: 'number.assigned';
} & NumberAssignedEvent) | ({
    type: 'number.released';
} & NumberReleasedEvent) | ({
    type: 'withdrawal.approved' | 'withdrawal.rejected';
} & WithdrawalStatusEvent);
export declare const ALL_WEBHOOK_EVENTS: WebhookEventType[];
export declare const ALL_SETTING_CATEGORIES: SettingCategory[];
//# sourceMappingURL=index.d.ts.map