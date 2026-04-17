import { NodeSDK } from '@opentelemetry/sdk-node';
import type { SpanExporter } from '@opentelemetry/sdk-trace-node';
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

let initialized = false;

export function initTracing() {
  if (initialized) return;
  if (!process.env.GCP_PROJECT_ID) {
    console.log('[tracing] GCP_PROJECT_ID not set, skipping Cloud Trace init');
    return;
  }
  const sdk = new NodeSDK({
    // Cast required: TraceExporter and sdk-node each pull in a different minor
    // version of sdk-trace-base, causing a structural type mismatch on ReadableSpan.
    // Safe at runtime — the interface is compatible.
    traceExporter: new TraceExporter({ projectId: process.env.GCP_PROJECT_ID }) as unknown as SpanExporter,
    instrumentations: [getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false }, // too noisy
    })],
  });
  sdk.start();
  initialized = true;
  console.log('[tracing] Cloud Trace initialized');
}
