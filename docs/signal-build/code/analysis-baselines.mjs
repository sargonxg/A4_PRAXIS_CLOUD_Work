// Pure reference guards. No provider inference, auth enforcement or live corpus.
import {createHash} from 'node:crypto';

const digest = text => createHash('sha256').update(text).digest('hex');
export function validateLocator(representation, locator) {
  if (!representation || typeof representation.id !== 'string' || !representation.id ||
      typeof representation.text !== 'string' || representation.hash !== digest(representation.text))
    throw new Error('Invalid canonical representation/hash.');
  if (!locator || locator.representationId !== representation.id || locator.representationHash !== representation.hash ||
      locator.offsetUnit !== 'utf16_code_unit' || !Number.isInteger(locator.start) || !Number.isInteger(locator.end) ||
      locator.start < 0 || locator.end <= locator.start || locator.end > representation.text.length ||
      typeof locator.quote !== 'string' || !locator.quote.trim() ||
      representation.text.slice(locator.start, locator.end) !== locator.quote)
    throw new Error('Locator must pin an exact span in the canonical revision.');
  // Do not accept an offset splitting a surrogate pair in a JS string.
  const splitsPair = at => at > 0 && at < representation.text.length &&
    /[\uD800-\uDBFF]/.test(representation.text[at-1]) && /[\uDC00-\uDFFF]/.test(representation.text[at]);
  if (splitsPair(locator.start) || splitsPair(locator.end)) throw new Error('Locator splits a Unicode surrogate pair.');
  return true;
}

function vectorNorm(vector, dimensions) {
  if (!Array.isArray(vector) || vector.length !== dimensions || vector.some(x => typeof x !== 'number' || !Number.isFinite(x)))
    throw new Error('Invalid embedding dimensions or values.');
  const norm = Math.hypot(...vector);
  if (!Number.isFinite(norm) || norm === 0) throw new Error('Invalid embedding norm.');
  return norm;
}
function namespace(spec) {
  const keys = ['provider','model','revision','dimensions','normalization','chunkingProfile','taskPair'];
  if (!spec || !Number.isInteger(spec.dimensions) || spec.dimensions < 1 || spec.dimensions > 8192 ||
      keys.filter(k => k !== 'dimensions').some(k => typeof spec[k] !== 'string' || !spec[k]))
    throw new Error('Missing embedding namespace configuration.');
  return JSON.stringify(keys.map(k => spec[k]));
}
export function rankedEmbeddingCandidates(query, candidates, {tenantId, deskId, k = 10} = {}) {
  if (!tenantId || !deskId || !Number.isInteger(k) || k < 1 || k > 100 || query.task !== 'query')
    throw new Error('Specify scope, a query task and a bounded candidate count.');
  const queryNamespace = namespace(query.spec), queryNorm = vectorNorm(query.vector, query.spec.dimensions);
  const visible = candidates.filter(c => c.tenantId === tenantId && c.deskId === deskId && c.permitted === true);
  const results = visible.map(c => {
    if (c.task !== 'document' || namespace(c.spec) !== queryNamespace)
      throw new Error('Embedding namespace/task mismatch; re-embedding is required.');
    const norm = vectorNorm(c.vector, c.spec.dimensions);
    // Multiply normalized components to avoid overflow for finite large vectors.
    const similarity = Math.max(-1, Math.min(1, query.vector.reduce((n,x,i) => n + (x/queryNorm)*(c.vector[i]/norm), 0)));
    return {id:c.id, similarity, status:'retrieval_candidate', interpretation:'similarity is not truth or narrative membership'};
  });
  return results.sort((a,b) => b.similarity-a.similarity || String(a.id).localeCompare(String(b.id))).slice(0,k);
}

function validateWindow(w) {
  if (!w || typeof w.panelRevision !== 'string' || !w.panelRevision ||
      typeof w.membershipRevision !== 'string' || !w.membershipRevision ||
      !Number.isInteger(w.durationSeconds) || w.durationSeconds <= 0 ||
      !Number.isInteger(w.eligibleFamilies) || !Number.isInteger(w.matchedFamilies) ||
      w.eligibleFamilies < 0 || w.matchedFamilies < 0 || w.matchedFamilies > w.eligibleFamilies ||
      !['healthy','degraded','blocked'].includes(w.health) || typeof w.complete !== 'boolean')
    throw new Error('Invalid panel window.');
}
export function attentionChange(current, baseline, {minBaselineWindows=3, minMatchedFamilies=5, minEligibleFamilies=20} = {}) {
  if (!Array.isArray(baseline) ||
      !Number.isInteger(minBaselineWindows) || minBaselineWindows < 1 ||
      !Number.isInteger(minMatchedFamilies) || minMatchedFamilies < 1 ||
      !Number.isInteger(minEligibleFamilies) || minEligibleFamilies < 1)
    throw new Error('Invalid attention screening configuration.');
  validateWindow(current); baseline.forEach(validateWindow);
  const base = {interpretation:'source-panel attention, not public opinion, reach or statistical significance'};
  if ([current,...baseline].some(w => w.health !== 'healthy' || !w.complete))
    return {...base, status:'degraded', reason:'incomplete or unhealthy collection window'};
  if (baseline.some(w => w.panelRevision !== current.panelRevision ||
      w.membershipRevision !== current.membershipRevision || w.durationSeconds !== current.durationSeconds))
    return {...base, status:'uncomparable', reason:'panel, membership or duration changed'};
  if (baseline.length < minBaselineWindows || current.eligibleFamilies < minEligibleFamilies ||
      current.matchedFamilies < minMatchedFamilies || baseline.some(w => w.eligibleFamilies < minEligibleFamilies))
    return {...base, status:'insufficient', reason:'configured volume/history floor not met'};
  const numerator = current.matchedFamilies, denominator = current.eligibleFamilies, rate = numerator/denominator;
  // Each comparable baseline window contributes equally, avoiding implicit volume weighting.
  const baselineRate = baseline.reduce((n,w) => n+w.matchedFamilies/w.eligibleFamilies,0)/baseline.length;
  return {...base, status:'screened', numerator, denominator, rate, baselineRate,
    ratio:baselineRate === 0 ? null : rate/baselineRate, baselineWindows:baseline.length,
    reason:baselineRate === 0 ? 'zero baseline; ratio unavailable' : 'descriptive comparison only'};
}

function pinMap(manifest) {
  if (!Array.isArray(manifest)) throw new Error('Manifest must contain typed dependency pins.');
  const map = new Map();
  for (const p of manifest) {
    if (!p || typeof p.type !== 'string' || !p.type || typeof p.id !== 'string' || !p.id ||
        typeof p.digest !== 'string' || !/^[a-f0-9]{64}$/.test(p.digest) || !['permitted','withdrawn'].includes(p.visibility))
      throw new Error('Invalid dependency pin.');
    const key = JSON.stringify([p.type,p.id]);
    if (map.has(key)) throw new Error('Duplicate dependency pin.');
    map.set(key,p);
  }
  return map;
}
export function manifestDelta(before, after) {
  const oldPins = pinMap(before), newPins = pinMap(after), changes = [];
  for (const key of [...new Set([...oldPins.keys(),...newPins.keys()])].sort()) {
    const oldPin = oldPins.get(key), newPin = newPins.get(key), pin = newPin || oldPin;
    let change;
    if (!oldPin) change='added';
    else if (!newPin) change='removed';
    else if (oldPin.visibility !== newPin.visibility) change=newPin.visibility === 'withdrawn' ? 'withdrawn' : 'restored';
    else if (oldPin.digest !== newPin.digest) change='revised';
    if (change) changes.push({type:pin.type,id:pin.id,change,before:oldPin||null,after:newPin||null});
  }
  return changes;
}
export function affectedDependents(edges, changedIds) {
  // Inputs use globally unambiguous typed node keys. Direction: artifact depends on dependency.
  const reverse = new Map();
  for (const edge of edges) {
    if (!edge || edge.predicate !== 'depends_on' || !edge.artifact || !edge.dependency)
      throw new Error('Expected typed depends_on edges.');
    if (!reverse.has(edge.dependency)) reverse.set(edge.dependency,new Set());
    reverse.get(edge.dependency).add(edge.artifact);
  }
  const changed = new Set(changedIds), seen = new Set(changed), queue = [...changed], impacted = new Set();
  for (let i=0;i<queue.length;i++) for (const artifact of reverse.get(queue[i]) || []) {
    if (!changed.has(artifact)) impacted.add(artifact);
    if (!seen.has(artifact)) { seen.add(artifact); queue.push(artifact); }
  }
  return [...impacted].sort();
}
