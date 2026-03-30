
//function
// session store (module-level)
export const sessions: Record<string, any> = {};

export function createSession(token: string, userId: number) {
  sessions[token] = { userId };
  return true;
}




//function
// feature flags
export const featureFlags: Record<string, boolean> = {
  beta: false,
};

export function isFeatureEnabled(flag: string): boolean {
  return featureFlags[flag] ?? false;
}



//function
// cache
export const cache: Record<string, any> = {};

export function getCachedValue(key: string) {
  return cache[key];
}



//function
// rate limiter
export const rateLimit: Record<string, number> = {};

export function isRateLimited(userId: string, limit: number) {
  const count = rateLimit[userId] || 0;

  if (count >= limit) return true;

  rateLimit[userId] = count + 1;
  return false;
}


