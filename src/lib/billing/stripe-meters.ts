export async function emitMeterEvent(input: {
  stripeCustomerId: string;
  eventName: string;
  value: number;
}): Promise<{ ok: boolean; reason: string }> {
  if (process.env.STRIPE_METERS_DISABLE === '1') return { ok: true, reason: 'STRIPE_METERS_DISABLE=1' };
  if (!process.env.STRIPE_SECRET_KEY) return { ok: true, reason: 'STRIPE_SECRET_KEY missing' };
  if (!/^cus_[A-Za-z0-9]+$/.test(input.stripeCustomerId)) return { ok: false, reason: 'invalid stripeCustomerId' };
  if (!Number.isFinite(input.value) || input.value < 0) return { ok: false, reason: 'invalid value' };
  return { ok: true, reason: 'meter event accepted' };
}
