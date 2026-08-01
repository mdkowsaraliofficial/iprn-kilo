import type { RewardRule, RewardRuleLevel, UserTier } from '@iprn/types';
export type RewardContext = {
    numberId: string | null;
    providerId: string | null;
    countryCode: string;
    operator: string;
    isOtp: boolean;
    hasOtp: boolean;
    userTier: UserTier;
    countryMultiplier: number;
    operatorMultiplier: number;
};
export type RewardResult = {
    rule: RewardRule;
    baseAmountCents: number;
    countryMultiplier: number;
    operatorMultiplier: number;
    userTierMultiplier: number;
    finalAmountCents: number;
};
export declare const LEVEL_SPECIFICITY: Record<RewardRuleLevel, number>;
export declare function levelLabel(level: RewardRuleLevel): string;
export declare function ruleMatches(rule: RewardRule, ctx: RewardContext): boolean;
export declare function evaluateReward(rules: RewardRule[], ctx: RewardContext): RewardResult | null;
//# sourceMappingURL=index.d.ts.map