import { describe, expect, it, vi } from 'vitest';
import { buildPraxisEvent, publishPraxisEvent } from '@/lib/events/praxis-events';

const publishPubSubJson = vi.fn();

vi.mock('@/lib/events/pubsub', () => ({
  publishPubSubJson: (input: unknown) => publishPubSubJson(input),
}));

describe('PRAXIS event fan-out', () => {
  it('builds a stable v1 PRAXIS event envelope', () => {
    const event = buildPraxisEvent({
      eventType: 'agent_run.created',
      ownerUid: 'u1',
      capsuleId: 'cap-1',
      runId: 'run-1',
      traceId: 'trace-1',
      source: 'agent',
      data: { triggerType: 'manual' },
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: 'agent_run.created',
      ownerUid: 'u1',
      capsuleId: 'cap-1',
      runId: 'run-1',
      traceId: 'trace-1',
      source: 'agent',
      data: { triggerType: 'manual' },
    });
    expect(event.eventId).toBeTruthy();
    expect(Date.parse(event.occurredAt)).not.toBeNaN();
  });

  it('publishes to praxis.events with routing attributes', async () => {
    publishPubSubJson.mockResolvedValueOnce(true);

    await expect(publishPraxisEvent({
      eventType: 'agent_run.dispatched',
      ownerUid: 'u1',
      capsuleId: 'cap-1',
      runId: 'run-1',
      traceId: 'trace-1',
      source: 'agent',
    })).resolves.toBe(true);

    expect(publishPubSubJson).toHaveBeenCalledWith(expect.objectContaining({
      topicName: 'praxis.events',
      attributes: expect.objectContaining({
        eventType: 'agent_run.dispatched',
        ownerUid: 'u1',
        capsuleId: 'cap-1',
        runId: 'run-1',
        traceId: 'trace-1',
        source: 'agent',
        schemaVersion: '1',
      }),
    }));
  });
});
