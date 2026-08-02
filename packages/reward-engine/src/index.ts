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

export const LEVEL_SPECIFICITY: Record<RewardRuleLevel, number> = {
  per_number: 1,
  per_provider: 2,
  per_operator: 3,
  per_country: 4,
  per_otp: 5,
  per_sms: 6,
  global: 7,
} as const;

const LEVEL_LABELS: Record<RewardRuleLevel, string> = {
  per_number: 'Per Number',
  per_provider: 'Per Provider',
  per_operator: 'Per Operator',
  per_country: 'Per Country',
  per_otp: 'Per OTP',
  per_sms: 'Per SMS',
  global: 'Global Default',
};

export function levelLabel(level: RewardRuleLevel): string {
  return LEVEL_LABELS[level];
}

export function ruleMatches(rule: RewardRule, ctx: RewardContext): boolean {
  if (!rule.active) return false;
  const now = new Date();
  if (rule.validFrom && now < new Date(rule.validFrom)) return false;
  if (rule.validTo && now > new Date(rule.validTo)) return false;

  switch (rule.level) {
    case 'per_number':
      return rule.target === ctx.numberId;
    case 'per_provider':
      return rule.target === ctx.providerId;
    case 'per_operator':
      return rule.target === `${ctx.countryCode}:${ctx.operator}`;
    case 'per_country':
      return rule.target === ctx.countryCode;
    case 'per_otp':
      return ctx.hasOtp || ctx.isOtp;
    case 'per_sms':
      return true;
    case 'global':
      return true;
    default:
      return false;
  }
}

const USER_TIER_MULTIPLIERS: Record<UserTier, number> = {
  bronze: 1.0,
  silver: 1.2,
  gold: 1.5,
  platinum: 2.0,
};

export function evaluateReward(rules: RewardRule[], ctx: RewardContext): RewardResult | null {
  const sorted = [...rules].sort((a, b) => {
    const diff = LEVEL_SPECIFICITY[a.level] - LEVEL_SPECIFICITY[b.level];
    if (diff !== 0) return diff;
    return b.priority - a.priority;
  });

  for (const rule of sorted) {
    if (ruleMatches(rule, ctx)) {
      const userTierMultiplier = USER_TIER_MULTIPLIERS[ctx.userTier] ?? 1.0;
      const finalCents = Math.round(
        rule.baseAmountCents *
          ctx.countryMultiplier *
          ctx.operatorMultiplier *
          userTierMultiplier *
          rule.multiplier
      );
      return {
        rule,
        baseAmountCents: rule.baseAmountCents,
        countryMultiplier: ctx.countryMultiplier,
        operatorMultiplier: ctx.operatorMultiplier,
        userTierMultiplier,
        finalAmountCents: finalCents,
      };
    }
  }
  return null;
}
