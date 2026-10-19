import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary } from './helpers/auth';

test('waits for owner context before sending the requested conversation turn', async ({ page }) => {
  test.skip(process.env.PRAXIS_EMULATOR_MODE !== 'local-ci', 'Isolated synthetic emulator regression only');
  test.setTimeout(90_000);
  const base = 'http://127.0.0.1:3000';
  const capsuleId = 'golden-path-capsule', conversationId = 'context-readiness-conversation';
  await authenticateFirebaseCanary(page, base, '/app', { expectComposer: false });
  const setup = await page.evaluate(async ({ conversationId, capsuleId }) => {
    const session = await fetch('/api/auth/session').then(response => response.json());
    const response = await fetch('/api/conversations', { method: 'POST', credentials: 'include',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ conversationId, capsuleId, appliedCapsules: [] }) });
    return { status: response.status, ownerId: session.user?.id };
  }, { conversationId, capsuleId });
  expect(setup).toEqual({ status: 201, ownerId: 'emulator-persona-user' });

  let releaseContext!: () => void, releaseHistory!: () => void, releaseCreate!: () => void;
  const contextGate = new Promise<void>(resolve => { releaseContext = resolve; });
  const historyGate = new Promise<void>(resolve => { releaseHistory = resolve; });
  const createGate = new Promise<void>(resolve => { releaseCreate = resolve; });
  let contextReceived = false, historyReceived = false, historyDelivered = false, holdCreate = false;
  let createReceived = false, createStatus = 0, turns = 0;
  let createBody: Record<string, unknown> | null = null, turnBody: Record<string, unknown> | null = null;
  await page.route('**/api/workspace/context-stack', async route => {
    if (route.request().method() !== 'GET') return route.continue();
    const response = await route.fetch(); // Preserve the real authenticated owner context.
    expect(response.ok()).toBe(true); contextReceived = true;
    await contextGate; await route.fulfill({ response });
  });
  await page.route(`**/api/conversations/${conversationId}`, async route => {
    const response = await route.fetch(); // Delay real owned empty history, without fabricating a turn.
    expect(response.ok()).toBe(true); historyReceived = true;
    await historyGate; await route.fulfill({ response }); historyDelivered = true;
  });
  await page.route('**/api/conversations', async route => {
    if (route.request().method() !== 'POST' || !holdCreate) return route.continue();
    createBody = route.request().postDataJSON();
    const response = await route.fetch(); // Prove the create preflight itself succeeds.
    createStatus = response.status(); createReceived = true;
    await createGate; await route.fulfill({ response });
  });
  await page.route(`**/api/conversations/${conversationId}/turns`, async route => {
    expect(route.request().method()).toBe('POST'); turns++; turnBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8',
      body: '0:"Synthetic readiness answer remains in the requested conversation."\n' });
  });
  try {
    await page.goto(`${base}/app/conversations/${conversationId}?capsuleId=${capsuleId}`);
    await expect.poll(() => contextReceived, { timeout: 30_000 }).toBe(true);
    await expect.poll(() => historyReceived, { timeout: 30_000 }).toBe(true);
    const composer = page.getByLabel(/Describe a task or responsibility/i);
    const send = page.getByRole('button', { name: 'Send to PRAXIS', exact: true });
    await composer.fill('Use this requested synthetic capsule for one readiness regression turn.');
    await expect(send).toBeDisabled(); // Fails on the former eager composer boundary.
    expect(turns).toBe(0);
    releaseContext();
    await expect(send).toBeEnabled({ timeout: 30_000 });
    holdCreate = true;
    await send.click();
    await expect.poll(() => createReceived, { timeout: 30_000 }).toBe(true);
    expect(createStatus).toBe(201);
    expect(createBody).toMatchObject({ conversationId, capsuleId });
    expect(turns).toBe(0); // Distinguish a delayed successful create from scope cancellation.
    await expect(send).toBeDisabled();
    releaseCreate();
    await expect.poll(() => turns).toBe(1);
    expect(turnBody).toMatchObject({ capsuleId, currentPath: `/app/conversations/${conversationId}?capsuleId=${capsuleId}` });
    const answer = page.getByTestId('praxis-answer-markdown').getByText('Synthetic readiness answer remains in the requested conversation.');
    await expect(answer).toBeVisible();
    releaseHistory();
    await expect.poll(() => historyDelivered, { timeout: 30_000 }).toBe(true);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(answer).toBeVisible();
    expect(turns).toBe(1);
    const owned = await page.evaluate(async id => {
      const response = await fetch(`/api/conversations/${id}`); const body = await response.json();
      return { status: response.status, ownerId: body.conversation?.ownerUid, capsuleId: body.conversation?.capsuleId };
    }, conversationId);
    expect(owned).toEqual({ status: 200, ownerId: setup.ownerId, capsuleId });
  } finally { releaseContext(); releaseHistory(); releaseCreate(); }
});
