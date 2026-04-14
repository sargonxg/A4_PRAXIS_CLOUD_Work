/**
 * PRAXIS Circuit Breaker — prevents cascade failures from external service outages.
 * State machine: closed → open (after N failures) → half-open (after timeout) → closed
 */

interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;   // failures before opening
  resetTimeoutMs: number;     // ms before attempting recovery
}

class CircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastFailure = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  getState() { return this.state; }
  getName() { return this.config.name; }

  async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.config.resetTimeoutMs) {
        this.state = 'half-open';
        console.log(`[circuit-breaker] ${this.config.name} entering HALF-OPEN — testing recovery`);
      } else {
        return fallback();
      }
    }
    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        console.log(`[circuit-breaker] ${this.config.name} CLOSED — recovered`);
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();
      if (this.failures >= this.config.failureThreshold) {
        this.state = 'open';
        console.error(`[circuit-breaker] ${this.config.name} OPENED after ${this.failures} failures`);
      }
      return fallback();
    }
  }
}

// Singleton breakers — one per external service
export const acledBreaker    = new CircuitBreaker({ name: 'ACLED',    failureThreshold: 3, resetTimeoutMs: 300_000 });
export const gdeltBreaker    = new CircuitBreaker({ name: 'GDELT',    failureThreshold: 5, resetTimeoutMs: 60_000 });
export const hdxBreaker      = new CircuitBreaker({ name: 'HDX',      failureThreshold: 3, resetTimeoutMs: 300_000 });
export const reliefwebBreaker= new CircuitBreaker({ name: 'ReliefWeb',failureThreshold: 3, resetTimeoutMs: 300_000 });
export const unhcrBreaker    = new CircuitBreaker({ name: 'UNHCR',    failureThreshold: 3, resetTimeoutMs: 300_000 });
export const worldbankBreaker= new CircuitBreaker({ name: 'WorldBank',failureThreshold: 3, resetTimeoutMs: 600_000 });
export const geminiBreaker   = new CircuitBreaker({ name: 'Gemini',   failureThreshold: 5, resetTimeoutMs: 60_000 });
export const firecrawlBreaker= new CircuitBreaker({ name: 'Firecrawl',failureThreshold: 3, resetTimeoutMs: 300_000 });

export function getAllBreakerStates(): Record<string, string> {
  return {
    ACLED: acledBreaker.getState(),
    GDELT: gdeltBreaker.getState(),
    HDX: hdxBreaker.getState(),
    ReliefWeb: reliefwebBreaker.getState(),
    UNHCR: unhcrBreaker.getState(),
    WorldBank: worldbankBreaker.getState(),
    Gemini: geminiBreaker.getState(),
    Firecrawl: firecrawlBreaker.getState(),
  };
}
