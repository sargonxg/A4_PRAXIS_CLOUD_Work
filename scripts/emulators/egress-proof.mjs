const guardMessage = 'Non-lane network connection blocked by isolated emulator guard';

/** Require interception by our guard; DNS/offline/proxy failures are not proof. */
export function isIsolatedNetworkRejection(error, seen = new Set()) {
  if (!error || typeof error !== 'object' || seen.has(error)) return false;
  seen.add(error);
  if (error.message === guardMessage) return true;
  if (isIsolatedNetworkRejection(error.cause, seen)) return true;
  return Array.isArray(error.errors) && error.errors.some(child => isIsolatedNetworkRejection(child, seen));
}
