import { z } from 'zod';
export declare const RewardRuleLevelSchema: z.ZodEnum<["global", "per_sms", "per_otp", "per_country", "per_operator", "per_provider", "per_number"]>;
export declare const RewardEventStatusSchema: z.ZodEnum<["pending", "approved", "reversed"]>;
export declare const NumberStatusSchema: z.ZodEnum<["available", "assigned", "suspended", "expired"]>;
export declare const SmsStatusSchema: z.ZodEnum<["received", "processed", "failed"]>;
export declare const WalletTransactionTypeSchema: z.ZodEnum<["reward", "manual_credit", "manual_debit", "withdrawal", "reversal", "bonus"]>;
export declare const WithdrawalStatusSchema: z.ZodEnum<["pending", "processing", "approved", "rejected", "completed"]>;
export declare const WithdrawalMethodSchema: z.ZodEnum<["crypto", "bank_transfer", "paypal", "other"]>;
export declare const ProviderTypeSchema: z.ZodEnum<["manual_pool", "http_api", "twilio", "plivo", "signalwire"]>;
export declare const WebhookEventTypeSchema: z.ZodEnum<["sms.received", "otp.extracted", "reward.credited", "number.assigned", "number.released", "withdrawal.approved", "withdrawal.rejected"]>;
export declare const WebhookDeliveryStatusSchema: z.ZodEnum<["pending", "success", "failed", "retrying"]>;
export declare const NotificationTypeSchema: z.ZodEnum<["info", "warning", "success", "error", "system"]>;
export declare const AuditSeveritySchema: z.ZodEnum<["info", "warning", "critical"]>;
export declare const LogCategorySchema: z.ZodEnum<["debug", "info", "warn", "error"]>;
export declare const LogLevelSchema: z.ZodEnum<["debug", "info", "warn", "error"]>;
export declare const UserRoleSchema: z.ZodEnum<["user", "admin"]>;
export declare const UserStatusSchema: z.ZodEnum<["active", "banned", "pending"]>;
export declare const UserTierSchema: z.ZodEnum<["bronze", "silver", "gold", "platinum"]>;
export declare const SortDirSchema: z.ZodEnum<["asc", "desc"]>;
export declare const SettingCategorySchema: z.ZodEnum<["general", "rewards", "numbers", "wallet", "api", "notifications", "sms_validation", "fraud", "providers", "analytics", "maintenance"]>;
export declare const ProblemDetailSchema: z.ZodObject<{
    type: z.ZodString;
    title: z.ZodString;
    status: z.ZodNumber;
    detail: z.ZodOptional<z.ZodString>;
    instance: z.ZodOptional<z.ZodString>;
    errors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    title: string;
    status: number;
    detail?: string | undefined;
    instance?: string | undefined;
    errors?: Record<string, string[]> | undefined;
}, {
    type: string;
    title: string;
    status: number;
    detail?: string | undefined;
    instance?: string | undefined;
    errors?: Record<string, string[]> | undefined;
}>;
export declare const PaginationMetaSchema: z.ZodObject<{
    cursor: z.ZodNullable<z.ZodString>;
    nextCursor: z.ZodNullable<z.ZodString>;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    hasNext: z.ZodBoolean;
    hasPrev: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    cursor: string | null;
    nextCursor: string | null;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
}, {
    cursor: string | null;
    nextCursor: string | null;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
}>;
export declare const PaginatedResultSchema: <T extends z.ZodType>(item: T) => z.ZodObject<{
    data: z.ZodArray<T, "many">;
    meta: z.ZodObject<{
        cursor: z.ZodNullable<z.ZodString>;
        nextCursor: z.ZodNullable<z.ZodString>;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        cursor: string | null;
        nextCursor: string | null;
        limit: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, {
        cursor: string | null;
        nextCursor: string | null;
        limit: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    data: T["_output"][];
    meta: {
        cursor: string | null;
        nextCursor: string | null;
        limit: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}, {
    data: T["_input"][];
    meta: {
        cursor: string | null;
        nextCursor: string | null;
        limit: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare const CursorPaginationSchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortDir: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    sortDir: "asc" | "desc";
    cursor?: string | undefined;
    sortBy?: string | undefined;
    search?: string | undefined;
}, {
    cursor?: string | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortDir?: "asc" | "desc" | undefined;
    search?: string | undefined;
}>;
export declare const SortQuerySchema: z.ZodObject<{
    sortBy: z.ZodOptional<z.ZodString>;
    sortDir: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    sortDir: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    sortBy?: string | undefined;
    sortDir?: "asc" | "desc" | undefined;
}>;
export declare const DateRangeSchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    from?: Date | undefined;
    to?: Date | undefined;
}, {
    from?: Date | undefined;
    to?: Date | undefined;
}>;
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    displayName: string;
}, {
    email: string;
    password: string;
    displayName: string;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    totpCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    totpCode?: string | undefined;
}, {
    email: string;
    password: string;
    totpCode?: string | undefined;
}>;
export declare const RefreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const UpdateProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    notificationPreferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    displayName?: string | undefined;
    timezone?: string | undefined;
    notificationPreferences?: Record<string, unknown> | undefined;
}, {
    displayName?: string | undefined;
    timezone?: string | undefined;
    notificationPreferences?: Record<string, unknown> | undefined;
}>;
export declare const NumberStatusFilterSchema: z.ZodOptional<z.ZodEnum<["all", "available", "assigned", "suspended", "expired"]>>;
export declare const NumberListQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortDir: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
} & {
    status: z.ZodOptional<z.ZodEnum<["all", "available", "assigned", "suspended", "expired"]>>;
    countryCode: z.ZodOptional<z.ZodString>;
    operator: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    sortDir: "asc" | "desc";
    status?: "available" | "assigned" | "suspended" | "expired" | "all" | undefined;
    cursor?: string | undefined;
    sortBy?: string | undefined;
    search?: string | undefined;
    countryCode?: string | undefined;
    operator?: string | undefined;
}, {
    status?: "available" | "assigned" | "suspended" | "expired" | "all" | undefined;
    cursor?: string | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortDir?: "asc" | "desc" | undefined;
    search?: string | undefined;
    countryCode?: string | undefined;
    operator?: string | undefined;
}>;
export declare const NumberRequestSchema: z.ZodObject<{
    countryCode: z.ZodString;
    operator: z.ZodString;
    preferredPool: z.ZodOptional<z.ZodString>;
    quantity: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["standard", "high"]>>>;
}, "strip", z.ZodTypeAny, {
    countryCode: string;
    operator: string;
    quantity: number;
    priority: "standard" | "high";
    preferredPool?: string | undefined;
}, {
    countryCode: string;
    operator: string;
    preferredPool?: string | undefined;
    quantity?: number | undefined;
    priority?: "standard" | "high" | undefined;
}>;
export declare const NumberResponseSchema: z.ZodObject<{
    id: z.ZodString;
    e164: z.ZodString;
    countryCode: z.ZodString;
    operator: z.ZodString;
    providerId: z.ZodString;
    status: z.ZodEnum<["available", "assigned", "suspended", "expired"]>;
    qualityScore: z.ZodNumber;
    notes: z.ZodNullable<z.ZodString>;
    lastSmsAt: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    assignedUserId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "available" | "assigned" | "suspended" | "expired";
    countryCode: string;
    operator: string;
    id: string;
    e164: string;
    providerId: string;
    qualityScore: number;
    notes: string | null;
    lastSmsAt: string | null;
    createdAt: string;
    assignedUserId: string | null;
}, {
    status: "available" | "assigned" | "suspended" | "expired";
    countryCode: string;
    operator: string;
    id: string;
    e164: string;
    providerId: string;
    qualityScore: number;
    notes: string | null;
    lastSmsAt: string | null;
    createdAt: string;
    assignedUserId: string | null;
}>;
export declare const NumberAssignmentResponseSchema: z.ZodObject<{
    id: z.ZodString;
    numberId: z.ZodString;
    userId: z.ZodString;
    assignedAt: z.ZodString;
    releasedAt: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["active", "released"]>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "released";
    id: string;
    numberId: string;
    userId: string;
    assignedAt: string;
    releasedAt: string | null;
}, {
    status: "active" | "released";
    id: string;
    numberId: string;
    userId: string;
    assignedAt: string;
    releasedAt: string | null;
}>;
export declare const CountryOperatorSummarySchema: z.ZodObject<{
    countryCode: z.ZodString;
    countryName: z.ZodString;
    available: z.ZodNumber;
    assigned: z.ZodNumber;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    available: number;
    assigned: number;
    total: number;
    countryCode: string;
    countryName: string;
}, {
    available: number;
    assigned: number;
    total: number;
    countryCode: string;
    countryName: string;
}>;
export declare const CountryResponseSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    name: z.ZodString;
    active: z.ZodBoolean;
    baseRewardMultiplier: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    code: string;
    id: string;
    name: string;
    baseRewardMultiplier: number;
}, {
    active: boolean;
    code: string;
    id: string;
    name: string;
    baseRewardMultiplier: number;
}>;
export declare const OperatorResponseSchema: z.ZodObject<{
    id: z.ZodString;
    countryCode: z.ZodString;
    name: z.ZodString;
    active: z.ZodBoolean;
    rewardMultiplier: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    countryCode: string;
    id: string;
    name: string;
    rewardMultiplier: number;
}, {
    active: boolean;
    countryCode: string;
    id: string;
    name: string;
    rewardMultiplier: number;
}>;
export declare const SmsResponseSchema: z.ZodObject<{
    id: z.ZodString;
    numberId: z.ZodString;
    userId: z.ZodString;
    sender: z.ZodString;
    body: z.ZodString;
    extractedOtp: z.ZodNullable<z.ZodString>;
    country: z.ZodString;
    operator: z.ZodString;
    providerId: z.ZodString;
    status: z.ZodEnum<["received", "processed", "failed"]>;
    rewardEventId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "received" | "processed" | "failed";
    operator: string;
    id: string;
    providerId: string;
    createdAt: string;
    numberId: string;
    userId: string;
    sender: string;
    body: string;
    extractedOtp: string | null;
    country: string;
    rewardEventId: string | null;
}, {
    status: "received" | "processed" | "failed";
    operator: string;
    id: string;
    providerId: string;
    createdAt: string;
    numberId: string;
    userId: string;
    sender: string;
    body: string;
    extractedOtp: string | null;
    country: string;
    rewardEventId: string | null;
}>;
export declare const SmsListQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortDir: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
} & {
    numberId: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    operator: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["all", "received", "processed", "failed"]>>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    sortDir: "asc" | "desc";
    status?: "received" | "processed" | "failed" | "all" | undefined;
    cursor?: string | undefined;
    sortBy?: string | undefined;
    search?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    operator?: string | undefined;
    numberId?: string | undefined;
    country?: string | undefined;
}, {
    status?: "received" | "processed" | "failed" | "all" | undefined;
    cursor?: string | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortDir?: "asc" | "desc" | undefined;
    search?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    operator?: string | undefined;
    numberId?: string | undefined;
    country?: string | undefined;
}>;
export declare const OtpResponseSchema: z.ZodObject<{
    id: z.ZodString;
    smsId: z.ZodString;
    numberId: z.ZodString;
    userId: z.ZodString;
    code: z.ZodString;
    extractedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    id: string;
    numberId: string;
    userId: string;
    smsId: string;
    extractedAt: string;
}, {
    code: string;
    id: string;
    numberId: string;
    userId: string;
    smsId: string;
    extractedAt: string;
}>;
export declare const OtpListQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortDir: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
} & {
    numberId: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    sortDir: "asc" | "desc";
    cursor?: string | undefined;
    sortBy?: string | undefined;
    search?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    numberId?: string | undefined;
}, {
    cursor?: string | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortDir?: "asc" | "desc" | undefined;
    search?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    numberId?: string | undefined;
}>;
export declare const WalletBalanceSchema: z.ZodObject<{
    userId: z.ZodString;
    pendingCents: z.ZodNumber;
    approvedCents: z.ZodNumber;
    frozenCents: z.ZodNumber;
    lifetimeEarnedCents: z.ZodNumber;
    lifetimeWithdrawnCents: z.ZodNumber;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    pendingCents: number;
    approvedCents: number;
    frozenCents: number;
    lifetimeEarnedCents: number;
    lifetimeWithdrawnCents: number;
    updatedAt: string;
}, {
    userId: string;
    pendingCents: number;
    approvedCents: number;
    frozenCents: number;
    lifetimeEarnedCents: number;
    lifetimeWithdrawnCents: number;
    updatedAt: string;
}>;
export declare const WalletTransactionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["reward", "manual_credit", "manual_debit", "withdrawal", "reversal", "bonus"]>;
    amountCents: z.ZodNumber;
    balanceAfterCents: z.ZodNumber;
    sourceType: z.ZodNullable<z.ZodString>;
    sourceId: z.ZodNullable<z.ZodString>;
    performedByUserId: z.ZodNullable<z.ZodString>;
    reason: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "reward" | "manual_credit" | "manual_debit" | "withdrawal" | "reversal" | "bonus";
    id: string;
    createdAt: string;
    userId: string;
    amountCents: number;
    balanceAfterCents: number;
    sourceType: string | null;
    sourceId: string | null;
    performedByUserId: string | null;
    reason: string | null;
}, {
    type: "reward" | "manual_credit" | "manual_debit" | "withdrawal" | "reversal" | "bonus";
    id: string;
    createdAt: string;
    userId: string;
    amountCents: number;
    balanceAfterCents: number;
    sourceType: string | null;
    sourceId: string | null;
    performedByUserId: string | null;
    reason: string | null;
}>;
export declare const WalletTransactionsQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortDir: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodOptional<z.ZodEnum<["reward", "manual_credit", "manual_debit", "withdrawal", "reversal", "bonus"]>>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    sortDir: "asc" | "desc";
    type?: "reward" | "manual_credit" | "manual_debit" | "withdrawal" | "reversal" | "bonus" | undefined;
    cursor?: string | undefined;
    sortBy?: string | undefined;
    search?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
}, {
    type?: "reward" | "manual_credit" | "manual_debit" | "withdrawal" | "reversal" | "bonus" | undefined;
    cursor?: string | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortDir?: "asc" | "desc" | undefined;
    search?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
}>;
export declare const RewardEventSchema: z.ZodObject<{
    id: z.ZodString;
    smsId: z.ZodString;
    userId: z.ZodString;
    ruleId: z.ZodString;
    baseAmountCents: z.ZodNumber;
    countryMultiplier: z.ZodNumber;
    operatorMultiplier: z.ZodNumber;
    userTierMultiplier: z.ZodNumber;
    finalAmountCents: z.ZodNumber;
    status: z.ZodEnum<["pending", "approved", "reversed"]>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "approved" | "reversed";
    id: string;
    createdAt: string;
    userId: string;
    smsId: string;
    ruleId: string;
    baseAmountCents: number;
    countryMultiplier: number;
    operatorMultiplier: number;
    userTierMultiplier: number;
    finalAmountCents: number;
}, {
    status: "pending" | "approved" | "reversed";
    id: string;
    createdAt: string;
    userId: string;
    smsId: string;
    ruleId: string;
    baseAmountCents: number;
    countryMultiplier: number;
    operatorMultiplier: number;
    userTierMultiplier: number;
    finalAmountCents: number;
}>;
export declare const RewardEventDetailSchema: z.ZodObject<{
    id: z.ZodString;
    smsId: z.ZodString;
    userId: z.ZodString;
    ruleId: z.ZodString;
    baseAmountCents: z.ZodNumber;
    countryMultiplier: z.ZodNumber;
    operatorMultiplier: z.ZodNumber;
    userTierMultiplier: z.ZodNumber;
    finalAmountCents: z.ZodNumber;
    status: z.ZodEnum<["pending", "approved", "reversed"]>;
    createdAt: z.ZodString;
} & {
    rule: z.ZodObject<{
        id: z.ZodString;
        level: z.ZodEnum<["global", "per_sms", "per_otp", "per_country", "per_operator", "per_provider", "per_number"]>;
        target: z.ZodNullable<z.ZodString>;
        baseAmountCents: z.ZodNumber;
        multiplier: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        baseAmountCents: number;
        level: "global" | "per_sms" | "per_otp" | "per_country" | "per_operator" | "per_provider" | "per_number";
        target: string | null;
        multiplier: number;
    }, {
        id: string;
        baseAmountCents: number;
        level: "global" | "per_sms" | "per_otp" | "per_country" | "per_operator" | "per_provider" | "per_number";
        target: string | null;
        multiplier: number;
    }>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "approved" | "reversed";
    id: string;
    createdAt: string;
    userId: string;
    smsId: string;
    ruleId: string;
    baseAmountCents: number;
    countryMultiplier: number;
    operatorMultiplier: number;
    userTierMultiplier: number;
    finalAmountCents: number;
    rule: {
        id: string;
        baseAmountCents: number;
        level: "global" | "per_sms" | "per_otp" | "per_country" | "per_operator" | "per_provider" | "per_number";
        target: string | null;
        multiplier: number;
    };
}, {
    status: "pending" | "approved" | "reversed";
    id: string;
    createdAt: string;
    userId: string;
    smsId: string;
    ruleId: string;
    baseAmountCents: number;
    countryMultiplier: number;
    operatorMultiplier: number;
    userTierMultiplier: number;
    finalAmountCents: number;
    rule: {
        id: string;
        baseAmountCents: number;
        level: "global" | "per_sms" | "per_otp" | "per_country" | "per_operator" | "per_provider" | "per_number";
        target: string | null;
        multiplier: number;
    };
}>;
export declare const RewardListQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortDir: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
} & {
    status: z.ZodOptional<z.ZodEnum<["pending", "approved", "reversed"]>>;
    country: z.ZodOptional<z.ZodString>;
    operator: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    sortDir: "asc" | "desc";
    status?: "pending" | "approved" | "reversed" | undefined;
    cursor?: string | undefined;
    sortBy?: string | undefined;
    search?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    operator?: string | undefined;
    country?: string | undefined;
}, {
    status?: "pending" | "approved" | "reversed" | undefined;
    cursor?: string | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortDir?: "asc" | "desc" | undefined;
    search?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    operator?: string | undefined;
    country?: string | undefined;
}>;
export declare const RewardSummarySchema: z.ZodObject<{
    today: z.ZodNumber;
    yesterday: z.ZodNumber;
    last7Days: z.ZodNumber;
    last30Days: z.ZodNumber;
    lifetime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    lifetime: number;
}, {
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    lifetime: number;
}>;
export declare const WithdrawalRequestSchema: z.ZodObject<{
    method: z.ZodEnum<["crypto", "bank_transfer", "paypal", "other"]>;
    address: z.ZodString;
    amountCents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amountCents: number;
    method: "crypto" | "bank_transfer" | "paypal" | "other";
    address: string;
}, {
    amountCents: number;
    method: "crypto" | "bank_transfer" | "paypal" | "other";
    address: string;
}>;
export declare const WithdrawalResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    amountCents: z.ZodNumber;
    method: z.ZodEnum<["crypto", "bank_transfer", "paypal", "other"]>;
    address: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "approved", "rejected", "completed"]>;
    reviewedBy: z.ZodNullable<z.ZodString>;
    reason: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    processedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "approved" | "processing" | "rejected" | "completed";
    id: string;
    createdAt: string;
    userId: string;
    amountCents: number;
    reason: string | null;
    method: "crypto" | "bank_transfer" | "paypal" | "other";
    address: string;
    reviewedBy: string | null;
    processedAt: string | null;
}, {
    status: "pending" | "approved" | "processing" | "rejected" | "completed";
    id: string;
    createdAt: string;
    userId: string;
    amountCents: number;
    reason: string | null;
    method: "crypto" | "bank_transfer" | "paypal" | "other";
    address: string;
    reviewedBy: string | null;
    processedAt: string | null;
}>;
export declare const WithdrawalListQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortDir: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
} & {
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "approved", "rejected", "completed"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    sortDir: "asc" | "desc";
    status?: "pending" | "approved" | "processing" | "rejected" | "completed" | undefined;
    cursor?: string | undefined;
    sortBy?: string | undefined;
    search?: string | undefined;
}, {
    status?: "pending" | "approved" | "processing" | "rejected" | "completed" | undefined;
    cursor?: string | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortDir?: "asc" | "desc" | undefined;
    search?: string | undefined;
}>;
export declare const ApiKeyResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    keyPrefix: z.ZodString;
    webhookUrl: z.ZodNullable<z.ZodString>;
    webhookEvents: z.ZodArray<z.ZodEnum<["sms.received", "otp.extracted", "reward.credited", "number.assigned", "number.released", "withdrawal.approved", "withdrawal.rejected"]>, "many">;
    permissions: z.ZodArray<z.ZodString, "many">;
    rateLimitOverride: z.ZodNullable<z.ZodNumber>;
    lastUsedAt: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    userId: string;
    keyPrefix: string;
    webhookUrl: string | null;
    webhookEvents: ("sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected")[];
    permissions: string[];
    rateLimitOverride: number | null;
    lastUsedAt: string | null;
}, {
    id: string;
    createdAt: string;
    userId: string;
    keyPrefix: string;
    webhookUrl: string | null;
    webhookEvents: ("sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected")[];
    permissions: string[];
    rateLimitOverride: number | null;
    lastUsedAt: string | null;
}>;
export declare const ApiKeyCreateSchema: z.ZodObject<{
    name: z.ZodString;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    rateLimitOverride: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    webhookUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    webhookEvents: z.ZodOptional<z.ZodArray<z.ZodEnum<["sms.received", "otp.extracted", "reward.credited", "number.assigned", "number.released", "withdrawal.approved", "withdrawal.rejected"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    webhookUrl?: string | null | undefined;
    webhookEvents?: ("sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected")[] | undefined;
    permissions?: string[] | undefined;
    rateLimitOverride?: number | null | undefined;
}, {
    name: string;
    webhookUrl?: string | null | undefined;
    webhookEvents?: ("sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected")[] | undefined;
    permissions?: string[] | undefined;
    rateLimitOverride?: number | null | undefined;
}>;
export declare const ApiKeyCreateResponseSchema: z.ZodObject<{
    id: z.ZodString;
    keyId: z.ZodString;
    keyPrefix: z.ZodString;
    secret: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    keyPrefix: string;
    keyId: string;
    secret: string;
}, {
    id: string;
    createdAt: string;
    keyPrefix: string;
    keyId: string;
    secret: string;
}>;
export declare const ApiKeyRotateResponseSchema: z.ZodObject<{
    id: z.ZodString;
    keyPrefix: z.ZodString;
    secret: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    keyPrefix: string;
    secret: string;
}, {
    id: string;
    keyPrefix: string;
    secret: string;
}>;
export declare const ApiKeyUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    webhookUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    webhookEvents: z.ZodOptional<z.ZodArray<z.ZodEnum<["sms.received", "otp.extracted", "reward.credited", "number.assigned", "number.released", "withdrawal.approved", "withdrawal.rejected"]>, "many">>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    rateLimitOverride: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    webhookUrl?: string | null | undefined;
    webhookEvents?: ("sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected")[] | undefined;
    permissions?: string[] | undefined;
    rateLimitOverride?: number | null | undefined;
}, {
    name?: string | undefined;
    webhookUrl?: string | null | undefined;
    webhookEvents?: ("sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected")[] | undefined;
    permissions?: string[] | undefined;
    rateLimitOverride?: number | null | undefined;
}>;
export declare const ApiKeyUsageSchema: z.ZodObject<{
    totalRequests: z.ZodNumber;
    requestsToday: z.ZodNumber;
    topEndpoints: z.ZodArray<z.ZodObject<{
        endpoint: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        endpoint: string;
        count: number;
    }, {
        endpoint: string;
        count: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    totalRequests: number;
    requestsToday: number;
    topEndpoints: {
        endpoint: string;
        count: number;
    }[];
}, {
    totalRequests: number;
    requestsToday: number;
    topEndpoints: {
        endpoint: string;
        count: number;
    }[];
}>;
export declare const WebhookResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    url: z.ZodString;
    events: z.ZodArray<z.ZodEnum<["sms.received", "otp.extracted", "reward.credited", "number.assigned", "number.released", "withdrawal.approved", "withdrawal.rejected"]>, "many">;
    secret: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    userId: string;
    updatedAt: string;
    secret: string;
    url: string;
    events: ("sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected")[];
}, {
    id: string;
    createdAt: string;
    userId: string;
    updatedAt: string;
    secret: string;
    url: string;
    events: ("sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected")[];
}>;
export declare const WebhookCreateSchema: z.ZodObject<{
    url: z.ZodString;
    events: z.ZodArray<z.ZodEnum<["sms.received", "otp.extracted", "reward.credited", "number.assigned", "number.released", "withdrawal.approved", "withdrawal.rejected"]>, "many">;
    secret: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    secret: string;
    url: string;
    events: ("sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected")[];
}, {
    url: string;
    events: ("sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected")[];
    secret?: string | undefined;
}>;
export declare const WebhookDeliverySchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    apiKeyId: z.ZodNullable<z.ZodString>;
    eventType: z.ZodEnum<["sms.received", "otp.extracted", "reward.credited", "number.assigned", "number.released", "withdrawal.approved", "withdrawal.rejected"]>;
    url: z.ZodString;
    status: z.ZodEnum<["pending", "success", "failed", "retrying"]>;
    attempts: z.ZodNumber;
    lastAttemptAt: z.ZodNullable<z.ZodString>;
    responseStatus: z.ZodNullable<z.ZodNumber>;
    responseBody: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "failed" | "success" | "retrying";
    id: string;
    createdAt: string;
    userId: string;
    url: string;
    apiKeyId: string | null;
    eventType: "sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected";
    attempts: number;
    lastAttemptAt: string | null;
    responseStatus: number | null;
    responseBody: string | null;
}, {
    status: "pending" | "failed" | "success" | "retrying";
    id: string;
    createdAt: string;
    userId: string;
    url: string;
    apiKeyId: string | null;
    eventType: "sms.received" | "otp.extracted" | "reward.credited" | "number.assigned" | "number.released" | "withdrawal.approved" | "withdrawal.rejected";
    attempts: number;
    lastAttemptAt: string | null;
    responseStatus: number | null;
    responseBody: string | null;
}>;
export declare const NotificationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["info", "warning", "success", "error", "system"]>;
    title: z.ZodString;
    body: z.ZodString;
    read: z.ZodBoolean;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "success" | "info" | "warning" | "error" | "system";
    title: string;
    id: string;
    createdAt: string;
    userId: string;
    body: string;
    read: boolean;
    data: Record<string, unknown>;
}, {
    type: "success" | "info" | "warning" | "error" | "system";
    title: string;
    id: string;
    createdAt: string;
    userId: string;
    body: string;
    read: boolean;
    data: Record<string, unknown>;
}>;
export declare const NotificationListQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortDir: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
} & {
    unreadOnly: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    sortDir: "asc" | "desc";
    cursor?: string | undefined;
    sortBy?: string | undefined;
    search?: string | undefined;
    unreadOnly?: boolean | undefined;
}, {
    cursor?: string | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortDir?: "asc" | "desc" | undefined;
    search?: string | undefined;
    unreadOnly?: boolean | undefined;
}>;
export declare const AnalyticsSummarySchema: z.ZodObject<{
    smsCountToday: z.ZodNumber;
    otpCountToday: z.ZodNumber;
    earningsTodayCents: z.ZodNumber;
    earnings7dCents: z.ZodNumber;
    earnings30dCents: z.ZodNumber;
    lifetimeEarningCents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    smsCountToday: number;
    otpCountToday: number;
    earningsTodayCents: number;
    earnings7dCents: number;
    earnings30dCents: number;
    lifetimeEarningCents: number;
}, {
    smsCountToday: number;
    otpCountToday: number;
    earningsTodayCents: number;
    earnings7dCents: number;
    earnings30dCents: number;
    lifetimeEarningCents: number;
}>;
export declare const AnalyticsByDaySchema: z.ZodObject<{
    date: z.ZodString;
    smsCount: z.ZodNumber;
    otpCount: z.ZodNumber;
    earningsCents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    date: string;
    smsCount: number;
    otpCount: number;
    earningsCents: number;
}, {
    date: string;
    smsCount: number;
    otpCount: number;
    earningsCents: number;
}>;
export declare const AnalyticsByCountrySchema: z.ZodObject<{
    countryCode: z.ZodString;
    countryName: z.ZodString;
    smsCount: z.ZodNumber;
    earningsCents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    countryCode: string;
    countryName: string;
    smsCount: number;
    earningsCents: number;
}, {
    countryCode: string;
    countryName: string;
    smsCount: number;
    earningsCents: number;
}>;
export declare const AnalyticsByOperatorSchema: z.ZodObject<{
    operator: z.ZodString;
    countryCode: z.ZodString;
    smsCount: z.ZodNumber;
    earningsCents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    countryCode: string;
    operator: string;
    smsCount: number;
    earningsCents: number;
}, {
    countryCode: string;
    operator: string;
    smsCount: number;
    earningsCents: number;
}>;
export declare const IngestSmsSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
    sender: z.ZodString;
    message: z.ZodString;
    providerId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    sender: string;
    phoneNumber: string;
    providerId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    message: string;
    sender: string;
    phoneNumber: string;
    providerId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const IngestSmsResponseSchema: z.ZodObject<{
    smsId: z.ZodString;
    rewardAmountCents: z.ZodNumber;
    otp: z.ZodNullable<z.ZodString>;
    processed: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    processed: boolean;
    smsId: string;
    rewardAmountCents: number;
    otp: string | null;
}, {
    processed: boolean;
    smsId: string;
    rewardAmountCents: number;
    otp: string | null;
}>;
export declare const RewardRuleSchema: z.ZodObject<{
    id: z.ZodString;
    level: z.ZodEnum<["global", "per_sms", "per_otp", "per_country", "per_operator", "per_provider", "per_number"]>;
    target: z.ZodNullable<z.ZodString>;
    baseAmountCents: z.ZodNumber;
    multiplier: z.ZodNumber;
    priority: z.ZodNumber;
    active: z.ZodBoolean;
    validFrom: z.ZodNullable<z.ZodString>;
    validTo: z.ZodNullable<z.ZodString>;
    notes: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    priority: number;
    id: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    baseAmountCents: number;
    level: "global" | "per_sms" | "per_otp" | "per_country" | "per_operator" | "per_provider" | "per_number";
    target: string | null;
    multiplier: number;
    validFrom: string | null;
    validTo: string | null;
}, {
    active: boolean;
    priority: number;
    id: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    baseAmountCents: number;
    level: "global" | "per_sms" | "per_otp" | "per_country" | "per_operator" | "per_provider" | "per_number";
    target: string | null;
    multiplier: number;
    validFrom: string | null;
    validTo: string | null;
}>;
export declare const RewardRuleCreateSchema: z.ZodObject<{
    level: z.ZodEnum<["global", "per_sms", "per_otp", "per_country", "per_operator", "per_provider", "per_number"]>;
    target: z.ZodNullable<z.ZodString>;
    baseAmountCents: z.ZodNumber;
    multiplier: z.ZodNumber;
    priority: z.ZodNumber;
    active: z.ZodDefault<z.ZodBoolean>;
    validFrom: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    validTo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    priority: number;
    baseAmountCents: number;
    level: "global" | "per_sms" | "per_otp" | "per_country" | "per_operator" | "per_provider" | "per_number";
    target: string | null;
    multiplier: number;
    notes?: string | null | undefined;
    validFrom?: string | null | undefined;
    validTo?: string | null | undefined;
}, {
    priority: number;
    baseAmountCents: number;
    level: "global" | "per_sms" | "per_otp" | "per_country" | "per_operator" | "per_provider" | "per_number";
    target: string | null;
    multiplier: number;
    active?: boolean | undefined;
    notes?: string | null | undefined;
    validFrom?: string | null | undefined;
    validTo?: string | null | undefined;
}>;
export declare const RewardRuleUpdateSchema: z.ZodObject<{
    level: z.ZodOptional<z.ZodEnum<["global", "per_sms", "per_otp", "per_country", "per_operator", "per_provider", "per_number"]>>;
    target: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    baseAmountCents: z.ZodOptional<z.ZodNumber>;
    multiplier: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodOptional<z.ZodNumber>;
    active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    validFrom: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    validTo: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    active?: boolean | undefined;
    priority?: number | undefined;
    notes?: string | null | undefined;
    baseAmountCents?: number | undefined;
    level?: "global" | "per_sms" | "per_otp" | "per_country" | "per_operator" | "per_provider" | "per_number" | undefined;
    target?: string | null | undefined;
    multiplier?: number | undefined;
    validFrom?: string | null | undefined;
    validTo?: string | null | undefined;
}, {
    active?: boolean | undefined;
    priority?: number | undefined;
    notes?: string | null | undefined;
    baseAmountCents?: number | undefined;
    level?: "global" | "per_sms" | "per_otp" | "per_country" | "per_operator" | "per_provider" | "per_number" | undefined;
    target?: string | null | undefined;
    multiplier?: number | undefined;
    validFrom?: string | null | undefined;
    validTo?: string | null | undefined;
}>;
export declare const ProviderSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    type: z.ZodEnum<["manual_pool", "http_api", "twilio", "plivo", "signalwire"]>;
    config: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    status: z.ZodEnum<["active", "inactive", "degraded"]>;
    healthScore: z.ZodNumber;
    lastCheckedAt: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "manual_pool" | "http_api" | "twilio" | "plivo" | "signalwire";
    status: "active" | "inactive" | "degraded";
    id: string;
    createdAt: string;
    name: string;
    updatedAt: string;
    slug: string;
    config: Record<string, unknown>;
    healthScore: number;
    lastCheckedAt: string | null;
}, {
    type: "manual_pool" | "http_api" | "twilio" | "plivo" | "signalwire";
    status: "active" | "inactive" | "degraded";
    id: string;
    createdAt: string;
    name: string;
    updatedAt: string;
    slug: string;
    config: Record<string, unknown>;
    healthScore: number;
    lastCheckedAt: string | null;
}>;
export declare const ProviderCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    type: z.ZodEnum<["manual_pool", "http_api", "twilio", "plivo", "signalwire"]>;
    config: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive", "degraded"]>>;
}, "strip", z.ZodTypeAny, {
    type: "manual_pool" | "http_api" | "twilio" | "plivo" | "signalwire";
    status: "active" | "inactive" | "degraded";
    name: string;
    slug: string;
    config: Record<string, unknown>;
}, {
    type: "manual_pool" | "http_api" | "twilio" | "plivo" | "signalwire";
    name: string;
    slug: string;
    status?: "active" | "inactive" | "degraded" | undefined;
    config?: Record<string, unknown> | undefined;
}>;
export declare const ProviderUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["manual_pool", "http_api", "twilio", "plivo", "signalwire"]>>;
    config: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["active", "inactive", "degraded"]>>>;
}, "strip", z.ZodTypeAny, {
    type?: "manual_pool" | "http_api" | "twilio" | "plivo" | "signalwire" | undefined;
    status?: "active" | "inactive" | "degraded" | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    config?: Record<string, unknown> | undefined;
}, {
    type?: "manual_pool" | "http_api" | "twilio" | "plivo" | "signalwire" | undefined;
    status?: "active" | "inactive" | "degraded" | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    config?: Record<string, unknown> | undefined;
}>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    displayName: z.ZodString;
    status: z.ZodEnum<["active", "banned", "pending"]>;
    role: z.ZodEnum<["user", "admin"]>;
    numberLimitOverride: z.ZodNullable<z.ZodNumber>;
    apiEnabled: z.ZodBoolean;
    createdAt: z.ZodString;
    tier: z.ZodOptional<z.ZodEnum<["bronze", "silver", "gold", "platinum"]>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "active" | "banned";
    email: string;
    displayName: string;
    id: string;
    createdAt: string;
    role: "user" | "admin";
    numberLimitOverride: number | null;
    apiEnabled: boolean;
    tier?: "bronze" | "silver" | "gold" | "platinum" | undefined;
}, {
    status: "pending" | "active" | "banned";
    email: string;
    displayName: string;
    id: string;
    createdAt: string;
    role: "user" | "admin";
    numberLimitOverride: number | null;
    apiEnabled: boolean;
    tier?: "bronze" | "silver" | "gold" | "platinum" | undefined;
}>;
export declare const UserUpdateSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["active", "banned", "pending"]>>;
    role: z.ZodOptional<z.ZodEnum<["user", "admin"]>>;
    numberLimitOverride: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    apiEnabled: z.ZodOptional<z.ZodBoolean>;
    tier: z.ZodOptional<z.ZodEnum<["bronze", "silver", "gold", "platinum"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "active" | "banned" | undefined;
    displayName?: string | undefined;
    role?: "user" | "admin" | undefined;
    numberLimitOverride?: number | null | undefined;
    apiEnabled?: boolean | undefined;
    tier?: "bronze" | "silver" | "gold" | "platinum" | undefined;
}, {
    status?: "pending" | "active" | "banned" | undefined;
    displayName?: string | undefined;
    role?: "user" | "admin" | undefined;
    numberLimitOverride?: number | null | undefined;
    apiEnabled?: boolean | undefined;
    tier?: "bronze" | "silver" | "gold" | "platinum" | undefined;
}>;
export declare const WalletAdjustmentSchema: z.ZodObject<{
    type: z.ZodEnum<["manual_credit", "manual_debit"]>;
    amountCents: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "manual_credit" | "manual_debit";
    amountCents: number;
    reason: string;
}, {
    type: "manual_credit" | "manual_debit";
    amountCents: number;
    reason: string;
}>;
export declare const SystemSettingSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodUnknown;
    description: z.ZodString;
    category: z.ZodEnum<["general", "rewards", "numbers", "wallet", "api", "notifications", "sms_validation", "fraud", "providers", "analytics", "maintenance"]>;
    updatedBy: z.ZodNullable<z.ZodString>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    updatedAt: string;
    key: string;
    description: string;
    category: "general" | "rewards" | "numbers" | "wallet" | "api" | "notifications" | "sms_validation" | "fraud" | "providers" | "analytics" | "maintenance";
    updatedBy: string | null;
    value?: unknown;
}, {
    updatedAt: string;
    key: string;
    description: string;
    category: "general" | "rewards" | "numbers" | "wallet" | "api" | "notifications" | "sms_validation" | "fraud" | "providers" | "analytics" | "maintenance";
    updatedBy: string | null;
    value?: unknown;
}>;
export declare const SystemSettingUpdateSchema: z.ZodObject<{
    value: z.ZodUnknown;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["general", "rewards", "numbers", "wallet", "api", "notifications", "sms_validation", "fraud", "providers", "analytics", "maintenance"]>>;
}, "strip", z.ZodTypeAny, {
    value?: unknown;
    description?: string | undefined;
    category?: "general" | "rewards" | "numbers" | "wallet" | "api" | "notifications" | "sms_validation" | "fraud" | "providers" | "analytics" | "maintenance" | undefined;
}, {
    value?: unknown;
    description?: string | undefined;
    category?: "general" | "rewards" | "numbers" | "wallet" | "api" | "notifications" | "sms_validation" | "fraud" | "providers" | "analytics" | "maintenance" | undefined;
}>;
export declare const HealthStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "degraded", "down"]>;
    timestamp: z.ZodString;
    components: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<["healthy", "degraded", "down"]>;
        latencyMs: z.ZodNullable<z.ZodNumber>;
        detail: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "degraded" | "healthy" | "down";
        detail: string | null;
        name: string;
        latencyMs: number | null;
    }, {
        status: "degraded" | "healthy" | "down";
        detail: string | null;
        name: string;
        latencyMs: number | null;
    }>, "many">;
    version: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "degraded" | "healthy" | "down";
    timestamp: string;
    components: {
        status: "degraded" | "healthy" | "down";
        detail: string | null;
        name: string;
        latencyMs: number | null;
    }[];
    version: string;
}, {
    status: "degraded" | "healthy" | "down";
    timestamp: string;
    components: {
        status: "degraded" | "healthy" | "down";
        detail: string | null;
        name: string;
        latencyMs: number | null;
    }[];
    version: string;
}>;
export declare const AuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodNullable<z.ZodString>;
    action: z.ZodString;
    resourceType: z.ZodString;
    resourceId: z.ZodNullable<z.ZodString>;
    changes: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    ip: z.ZodNullable<z.ZodString>;
    userAgent: z.ZodNullable<z.ZodString>;
    severity: z.ZodEnum<["info", "warning", "critical"]>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    changes: Record<string, unknown> | null;
    ip: string | null;
    userAgent: string | null;
    severity: "info" | "warning" | "critical";
}, {
    id: string;
    createdAt: string;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    changes: Record<string, unknown> | null;
    ip: string | null;
    userAgent: string | null;
    severity: "info" | "warning" | "critical";
}>;
export declare const SystemLogSchema: z.ZodObject<{
    id: z.ZodString;
    level: z.ZodEnum<["debug", "info", "warn", "error"]>;
    category: z.ZodString;
    message: z.ZodString;
    context: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    id: string;
    createdAt: string;
    level: "info" | "error" | "debug" | "warn";
    category: string;
    context: Record<string, unknown> | null;
}, {
    message: string;
    id: string;
    createdAt: string;
    level: "info" | "error" | "debug" | "warn";
    category: string;
    context: Record<string, unknown> | null;
}>;
export declare const UserProfileSchema: z.ZodObject<{
    userId: z.ZodString;
    displayName: z.ZodString;
    email: z.ZodString;
    timezone: z.ZodString;
    notificationPreferences: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    numberLimit: z.ZodNumber;
    apiEnabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    email: string;
    displayName: string;
    timezone: string;
    notificationPreferences: Record<string, unknown>;
    userId: string;
    apiEnabled: boolean;
    numberLimit: number;
}, {
    email: string;
    displayName: string;
    timezone: string;
    notificationPreferences: Record<string, unknown>;
    userId: string;
    apiEnabled: boolean;
    numberLimit: number;
}>;
export declare const OrderSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    numberId: z.ZodNullable<z.ZodString>;
    type: z.ZodEnum<["number_purchase", "subscription"]>;
    status: z.ZodEnum<["pending", "completed", "cancelled", "refunded"]>;
    amountCents: z.ZodNumber;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "number_purchase" | "subscription";
    status: "pending" | "completed" | "cancelled" | "refunded";
    id: string;
    createdAt: string;
    numberId: string | null;
    userId: string;
    amountCents: number;
}, {
    type: "number_purchase" | "subscription";
    status: "pending" | "completed" | "cancelled" | "refunded";
    id: string;
    createdAt: string;
    numberId: string | null;
    userId: string;
    amountCents: number;
}>;
export declare const NumberResponseArraySchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    e164: z.ZodString;
    countryCode: z.ZodString;
    operator: z.ZodString;
    providerId: z.ZodString;
    status: z.ZodEnum<["available", "assigned", "suspended", "expired"]>;
    qualityScore: z.ZodNumber;
    notes: z.ZodNullable<z.ZodString>;
    lastSmsAt: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    assignedUserId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "available" | "assigned" | "suspended" | "expired";
    countryCode: string;
    operator: string;
    id: string;
    e164: string;
    providerId: string;
    qualityScore: number;
    notes: string | null;
    lastSmsAt: string | null;
    createdAt: string;
    assignedUserId: string | null;
}, {
    status: "available" | "assigned" | "suspended" | "expired";
    countryCode: string;
    operator: string;
    id: string;
    e164: string;
    providerId: string;
    qualityScore: number;
    notes: string | null;
    lastSmsAt: string | null;
    createdAt: string;
    assignedUserId: string | null;
}>, "many">;
//# sourceMappingURL=index.d.ts.map