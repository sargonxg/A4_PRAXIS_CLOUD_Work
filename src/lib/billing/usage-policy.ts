/**
 * Billing usage-policy — stubbed during MVP cleanup. Values mirror prior
 * production constants so credit deduction and UI copy remain stable.
 */
export const PRAXIS_ASK_TOKEN_COST = 10;
export const PRAXIS_STARTER_TOKEN_ALLOWANCE = 1000;
export const PRAXIS_USAGE_COPY = {
  starterLabel: 'Free tier',
  upgradeLabel: 'Upgrade',
  shortLabel: 'credits',
  askCost: '1 credit per ask',
  starterAllowance: '1,000 credits to start',
} as const;
