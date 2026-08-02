import { describe, it, expect } from 'vitest';
import { evaluateReward, ruleMatches, LEVEL_SPECIFICITY } from './index';
import type { RewardRule } from '@iprn/types';

function rule(overrides: Partial<RewardRule>): RewardRule {
  return {
    id: 'r1',
    level: 'global',
    target: null,
    baseAmountCents: 100,
    multiplier: 1,
    priority: 0,
    active: true,
    validFrom: null,
    validTo: null,
    notes: null,
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00',
    ...overrides,
  };
}

const baseCtx = {
  numberId: 'num_abc',
  providerId: 'prov_1',
  countryCode: 'GB',
  operator: 'Acme',
  isOtp: false,
  hasOtp: false,
  userTier: 'bronze' as const,
  countryMultiplier: 1,
  operatorMultiplier: 1,
};

describe('reward-engine', () => {
  it('evaluates a global rule with default multipliers', () => {
    const r = evaluateReward([rule({})], baseCtx);
    expect(r).not.toBeNull();
    expect(r!.finalAmountCents).toBe(100);
    expect(r!.userTierMultiplier).toBe(1.0);
  });

  it('applies country and operator multipliers', () => {
    const r = evaluateReward([rule({})], { ...baseCtx, countryMultiplier: 1.5, operatorMultiplier: 2 });
    expect(r!.finalAmountCents).toBe(Math.round(100 * 1.5 * 2 * 1.0 * 1));
  });

  it('applies user tier multiplier (silver = 1.2x)', () => {
    const r = evaluateReward([rule({})], { ...baseCtx, userTier: 'silver' });
    expect(r!.userTierMultiplier).toBe(1.2);
    expect(r!.finalAmountCents).toBe(Math.round(100 * 1.2));
  });

  it('picks the most specific matching rule (per_country over global)', () => {
    const global = rule({ id: 'g1', level: 'global', baseAmountCents: 100 });
    const country = rule({ id: 'c1', level: 'per_country', target: 'GB', baseAmountCents: 50, priority: 5 });
    const r = evaluateReward([global, country], baseCtx);
    expect(r!.rule.id).toBe('c1');
    expect(r!.finalAmountCents).toBe(50);
    expect(LEVEL_SPECIFICITY.per_country).toBeLessThan(LEVEL_SPECIFICITY.global);
  });

  it('matches per_number when the target matches', () => {
    const perNumber = rule({ id: 'n1', level: 'per_number', target: 'num_abc', baseAmountCents: 10 });
    const global = rule({ id: 'g1', level: 'global', baseAmountCents: 100 });
    const r = evaluateReward([global, perNumber], baseCtx);
    expect(r!.rule.id).toBe('n1');
    expect(r!.finalAmountCents).toBe(10);
  });

  it('skips inactive rules and falls back', () => {
    const inactive = rule({ id: 'i1', level: 'global', active: false, baseAmountCents: 10 });
    const active = rule({ id: 'a1', level: 'global', baseAmountCents: 200 });
    const r = evaluateReward([inactive, active], baseCtx);
    expect(r!.rule.id).toBe('a1');
    expect(r!.finalAmountCents).toBe(200);
  });

  it('skips expired rules', () => {
    const expired = rule({ id: 'e1', level: 'global', baseAmountCents: 500, validTo: '2000-01-01 00:00:00' });
    const r = evaluateReward([expired], baseCtx);
    expect(r).toBeNull();
  });

  it('matches per_otp only when otp present', () => {
    const perOtp = rule({ id: 'o1', level: 'per_otp', baseAmountCents: 25 });
    const global = rule({ id: 'g1', level: 'global', baseAmountCents: 100 });
    expect(evaluateReward([global, perOtp], { ...baseCtx, hasOtp: true, isOtp: true })!.rule.id).toBe('o1');
    expect(evaluateReward([global, perOtp], { ...baseCtx, hasOtp: false, isOtp: false })!.rule.id).toBe('g1');
  });

  it('returns null when no rule matches', () => {
    const r = evaluateReward([rule({ level: 'per_number', target: 'other_number' })], baseCtx);
    expect(r).toBeNull();
  });
});
