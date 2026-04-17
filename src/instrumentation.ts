export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initTracing } = await import('./lib/observability/tracing');
    initTracing();
  }
}
