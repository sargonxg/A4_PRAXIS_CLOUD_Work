export const PRAXIS_STARTER_TOKEN_ALLOWANCE = 1000;
export const PRAXIS_ASK_TOKEN_COST = 10;

export const PRAXIS_USAGE_COPY = {
  starterAllowance: `${PRAXIS_STARTER_TOKEN_ALLOWANCE.toLocaleString()} PRAXIS tokens`,
  askCost: `${PRAXIS_ASK_TOKEN_COST} tokens per Ask PRAXIS question`,
} as const;
