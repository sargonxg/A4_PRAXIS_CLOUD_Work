import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignalWorldResearchRequestSchema, buildSignalWorldResearchEvidence, validateSignalWorldResearchOutput, researchSignalWorld, signalWorldResearchFailureDiagnostic } from '@/lib/signal/world-research';
import type { SignalWorldSnapshot } from '@/lib/signal/world-schema';

const gateway = vi.hoisted(() => ({ generate: vi.fn(), getModel: vi.fn((id: string) => id) }));
vi.mock('ai', () => ({ generateText: gateway.generate, Output: { object: (v: unknown) => v } }));
vi.mock('@/lib/ai/providers', () => ({ getModel: gateway.getModel }));
vi.mock('@/lib/ai/model-runtime-policy', () => ({ getAskPraxisModelRuntimePolicy: () => ({ frontierPrimary: { chatModelId: 'primary' }, stableFallback: { chat: ['fallback', 'primary', 'third', 'fourth'] } }) }));
const at = '2026-10-05T12:00:00.000Z';
function snapshot(): SignalWorldSnapshot {
  return { catalogVersion: 'fixture', inputDigest: 'fixture', updatedAt: at, refresh: { window: 'fixture', status: 'partial', attemptedAt: at }, limitations: ['Synthetic fixture'], countries: [{ code: 'BR', worldBankCode: 'BRA', name: 'Brazil', region: 'Americas', conflictTags: [], governmentPortals: [{ label: 'Unverified government directory', url: 'https://example.org/directory', provenanceUrl: 'https://example.org/directory', verification: 'unverified', checkedAt: null }], mediaOrganizations: [], feedIds: ['fixture'], providers: [], topics: [], metrics: [{ indicator: 'SP.POP.TOTL', label: 'Population', unit: 'people', value: 12345, year: 2024, providerUrl: 'https://api.worldbank.org/v2/country/BRA/indicator/SP.POP.TOTL', retrievedAt: at, status: 'available', license: 'Fixture' }], headlines: [{ id: 'headline-1', title: 'SYNTHETIC: Talks remain conditional', url: 'https://example.org/headline', feedId: 'fixture', publishedAt: '2026-10-04T12:00:00.000Z', retrievedAt: at, language: 'en', countryCode: 'BR', countryAssignment: 'curated-feed' }] }] };
}
const input = { question: 'What does the sampled panel report?', countryCode: 'BR' };
const observation = { text: 'The fixture population observation is 12345 people for 2024.', kind: 'reported-data', citationIds: ['metric-BR-SP.POP.TOTL-2024'] };
beforeEach(() => { gateway.generate.mockReset(); gateway.getModel.mockClear(); });

describe('source-grounded shared world research', () => {
  it('constructs bounded records with actual values, years and provider links and no government factual evidence', () => {
    const evidence = buildSignalWorldResearchEvidence(snapshot(), input);
    expect(evidence.records[0]).toMatchObject({ value: 12345, year: 2024, unit: 'people', url: snapshot().countries[0].metrics[0].providerUrl });
    expect(evidence.prompt).not.toContain('https://example.org/directory');
    expect(JSON.parse(evidence.prompt).posture.headlineMeaning).toContain('Discovery');
    const many = snapshot(); many.countries[0].headlines = Array.from({ length: 80 }, (_, i) => ({ ...many.countries[0].headlines[0], id: 'headline-' + i }));
    expect(buildSignalWorldResearchEvidence(many, input).records.filter(r => r.kind === 'headline')).toHaveLength(15);
    many.countries[0].headlines[0].publishedAt = null;
    expect(buildSignalWorldResearchEvidence(many, input).records.some(r => r.id === 'headline-0')).toBe(false);
    const shared = snapshot(); shared.countries.push({ ...shared.countries[0], code: 'JP', name: 'Japan', headlines: [{ ...shared.countries[0].headlines[0], countryCode: 'JP' }] });
    expect(buildSignalWorldResearchEvidence(shared, { question: input.question }).records.filter(r => r.kind === 'headline')).toHaveLength(1);
    const named = snapshot(); named.countries[0].metrics[0].providerCountryName = 'Provider-defined area';
    const provenance = buildSignalWorldResearchEvidence(named, input);
    expect(validateSignalWorldResearchOutput(provenance, { observations: [observation], limitations: [] }).answer).toContain('provider area: Provider-defined area');
  });
  it('keeps unknown metrics and dates unavailable and fails on an empty usable selection', () => {
    const empty = snapshot(); empty.countries[0].metrics[0].value = null; empty.countries[0].headlines[0].publishedAt = null;
    expect(() => buildSignalWorldResearchEvidence(empty, input)).toThrow('No dated headlines');
    expect(() => buildSignalWorldResearchEvidence({ ...snapshot(), updatedAt: null }, input)).toThrow('not available yet');
    expect(SignalWorldResearchRequestSchema.safeParse({ ...input, countryCode: 'ZZ' }).success).toBe(false);
    expect(SignalWorldResearchRequestSchema.safeParse({ ...input, actorUid: 'forged' }).success).toBe(false);
  });
  it('retains the World Bank statistical entity separately from the Palestine app selection', () => {
    const data = snapshot(); const country = data.countries[0]; country.code = 'PS'; country.name = 'Palestine'; country.worldBankCode = 'PSE';
    Object.assign(country.metrics[0], { providerCountryName: 'West Bank and Gaza', providerCountryCode: 'PSE', providerUrl: 'https://api.worldbank.org/v2/country/PSE/indicator/SP.POP.TOTL' });
    const evidence = buildSignalWorldResearchEvidence(data, { ...input, countryCode: 'PS' });
    const metric = JSON.parse(evidence.prompt).records[0];
    expect(metric.country).toBe('Palestine'); expect(metric.providerCountryName).toBe('West Bank and Gaza'); expect(metric.providerCountryCode).toBe('PSE');
    const result = validateSignalWorldResearchOutput(evidence, { observations: [{ ...observation, citationIds: ['metric-PS-SP.POP.TOTL-2024'] }], limitations: [] });
    expect(result.observations[0].text).toContain('Palestine (provider area: West Bank and Gaza)');
    expect(result.sources[0].url).toBe('https://api.worldbank.org/v2/country/PSE/indicator/SP.POP.TOTL');
  });
  it('derives answer and server-owned links only after matching injected citation IDs', () => {
    const evidence = buildSignalWorldResearchEvidence(snapshot(), input);
    const answer = validateSignalWorldResearchOutput(evidence, { observations: [observation], limitations: ['Synthetic data; requires review'] });
    expect(answer.answer).toContain('Reported data:'); expect(answer.sources).toEqual([{ id: evidence.records[0].id, title: 'Population', url: evidence.records[0].url, publisher: 'World Bank', license: 'Fixture' }]);
    expect(() => validateSignalWorldResearchOutput(evidence, { observations: [{ ...observation, citationIds: ['invented'] }], limitations: [] })).toThrow('outside the supplied');
    expect(() => validateSignalWorldResearchOutput(evidence, { observations: [{ ...observation, citationIds: [] }], limitations: [] })).toThrow('lacks a supplied');
    expect(() => validateSignalWorldResearchOutput(evidence, { observations: [{ ...observation, text: 'See https://invented.example/facts' }], limitations: [] })).toThrow('source list');
    const canonical = validateSignalWorldResearchOutput(evidence, { observations: [{ ...observation, text: 'The population is a fabricated 9999999 in 2026.', exactQuote: 'Fabricated population quotation: 9999999' }], limitations: [] });
    expect(canonical.observations[0].text).toContain('12345 people; reported year 2024'); expect(canonical.answer).not.toContain('9999999'); expect(canonical.observations[0]).not.toHaveProperty('exactQuote');
    expect(() => validateSignalWorldResearchOutput(evidence, { observations: [{ ...observation, kind: 'interpretation', text: 'Public opinion has a polarization score of 80.' }], limitations: [] })).toThrow('no verified audience');
  });
  it('keeps headline interpretations distinct from data facts and rejects fabricated exact quotations', () => {
    const evidence = buildSignalWorldResearchEvidence(snapshot(), input);
    const interpreted = { text: 'This sampled title frames the talks as conditional; the event is not verified.', kind: 'interpretation', citationIds: ['headline-1'], exactQuote: 'Talks remain conditional' };
    const valid = validateSignalWorldResearchOutput(evidence, { observations: [interpreted, { text: 'The actual event outcome is unknown.', kind: 'unknown', citationIds: [] }], limitations: [] });
    expect(valid.answer).toContain('Interpretation:'); expect(valid.answer).toContain('Unknown:');
    expect(() => validateSignalWorldResearchOutput(evidence, { observations: [{ ...interpreted, exactQuote: 'Talks concluded successfully' }], limitations: [] })).toThrow('does not match');
    expect(() => validateSignalWorldResearchOutput(evidence, { observations: [{ ...interpreted, kind: 'unknown', exactQuote: 'Talks concluded successfully' }], limitations: [] })).toThrow('does not match');
    expect(() => validateSignalWorldResearchOutput(evidence, { observations: [{ ...interpreted, kind: 'reported-data' }], limitations: [] })).toThrow('interpretation posture');
  });
  it('preserves actual author, publisher and licence in server citations and rejects model-forged attribution', () => {
    const data = snapshot(); Object.assign(data.countries[0].headlines[0], { author: 'Actual fixture author', publisher: 'Global Voices', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' });
    const evidence = buildSignalWorldResearchEvidence(data, input);
    const reading = { text: 'The sampled title uses conditional framing.', kind: 'interpretation', citationIds: ['headline-1'], exactQuote: 'Talks remain conditional' };
    const result = validateSignalWorldResearchOutput(evidence, { observations: [reading], limitations: [] });
    expect(result.sources[0]).toEqual({ id: 'headline-1', title: data.countries[0].headlines[0].title, url: data.countries[0].headlines[0].url, author: 'Actual fixture author', publisher: 'Global Voices', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' });
    expect(() => validateSignalWorldResearchOutput(evidence, { observations: [{ ...reading, author: 'Model-forged author' }], limitations: [] })).toThrow();
    expect(() => validateSignalWorldResearchOutput(evidence, { observations: [reading], limitations: [], sources: [{ author: 'Model-forged author' }] })).toThrow();
  });
  it('uses normal gateway model candidates with bounded 404 fallback and no external tools', async () => {
    gateway.generate.mockRejectedValueOnce({ statusCode: 404 }).mockResolvedValueOnce({ output: { observations: [observation], limitations: [] }, usage: { totalTokens: 22 } });
    const result = await researchSignalWorld(buildSignalWorldResearchEvidence(snapshot(), input), 'Existing calibrated block');
    expect(result.model).toBe('fallback'); expect(result.reviewRequired).toBe(true); expect(result.tokens).toBe(22);
    expect(gateway.generate).toHaveBeenCalledTimes(2);
    const call = gateway.generate.mock.calls[0][0]; expect(call.tools).toBeUndefined(); expect(call.maxRetries).toBe(0); expect(call.maxOutputTokens).toBe(5000); expect(call.system).toContain('untrusted quoted data');
  });
  it('returns typed 503 on model/evidence failure without persisting anything or trying unlimited candidates', async () => {
    gateway.generate.mockRejectedValue({ statusCode: 404 });
    await expect(researchSignalWorld(buildSignalWorldResearchEvidence(snapshot(), input), '')).rejects.toMatchObject({ status: 503 }); expect(gateway.generate).toHaveBeenCalledTimes(3);
    gateway.generate.mockReset().mockResolvedValue({ output: { observations: [{ ...observation, citationIds: ['fake'] }], limitations: [] }, usage: { totalTokens: 22 } });
    await expect(researchSignalWorld(buildSignalWorldResearchEvidence(snapshot(), input), '')).rejects.toMatchObject({ status: 503 }); expect(gateway.generate).toHaveBeenCalledTimes(1);
  });
  it('logs only whitelisted failure metadata without credential, question or provider-output leakage', async () => {
    const privateText = 'SECRET_TOKEN_AND_PRIVATE_QUESTION_AND_RAW_PROVIDER_RESPONSE';
    const failure = { name: 'AI_NoObjectGeneratedError', finishReason: 'length', message: privateText, text: privateText, response: { body: privateText }, prompt: privateText, cause: { name: 'AI_JSONParseError', message: privateText, value: privateText, statusCode: 503 } };
    expect(signalWorldResearchFailureDiagnostic(failure)).toEqual({ event: 'signal-world-research-failure', category: 'structured-object-not-generated', causeCategory: 'structured-json-parse', status: 503, finishReason: 'length' });
    expect(signalWorldResearchFailureDiagnostic({ name: privateText, statusCode: 700, finishReason: privateText, cause: { name: privateText, response: privateText } })).toEqual({ event: 'signal-world-research-failure', category: 'unknown', causeCategory: 'unknown' });
    const logged = vi.spyOn(console, 'warn').mockImplementation(() => {});
    gateway.generate.mockRejectedValueOnce(failure);
    await expect(researchSignalWorld(buildSignalWorldResearchEvidence(snapshot(), input), privateText)).rejects.toMatchObject({ status: 503 });
    expect(logged).toHaveBeenCalledWith('[signal-world-research]', signalWorldResearchFailureDiagnostic(failure));
    expect(gateway.generate).toHaveBeenCalledTimes(1); expect(gateway.generate.mock.calls[0][0]).toMatchObject({ maxOutputTokens: 5000, maxRetries: 0 });
    expect(JSON.stringify(logged.mock.calls)).not.toContain(privateText); logged.mockRestore();
  });
});
