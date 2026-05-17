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
  getDetails() {
    return {
      name: this.config.name,
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure || null,
    };
  }

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
    } catch {
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

// Singleton breakers — one per supported external service
export const geminiBreaker   = new CircuitBreaker({ name: 'Gemini',   failureThreshold: 5, resetTimeoutMs: 60_000 });
export const groundedSearchBreaker = new CircuitBreaker({ name: 'Grounded Search', failureThreshold: 3, resetTimeoutMs: 300_000 });

/** Returns simple state map — name → 'closed'|'open'|'half-open' */
export function getAllBreakerStates(): Record<string, string> {
  return {
    Gemini:    geminiBreaker.getState(),
    GroundedSearch: groundedSearchBreaker.getState(),
  };
}

/** Returns rich breaker details for health dashboard */
export function getAllBreakerDetails() {
  return [
    geminiBreaker,
    groundedSearchBreaker,
  ].map((b) => b.getDetails());
}
