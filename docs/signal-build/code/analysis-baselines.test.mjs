import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateLocator,rankedEmbeddingCandidates,attentionChange,manifestDelta,affectedDependents} from './analysis-baselines.mjs';
const hash = text => createHash('sha256').update(text).digest('hex');
const representation = text => ({id:'r1',text,hash:hash(text)});
const locator = (r,start,end) => ({representationId:r.id,representationHash:r.hash,offsetUnit:'utf16_code_unit',start,end,quote:r.text.slice(start,end)});
const spec = {provider:'synthetic',model:'m1',revision:'v1',dimensions:2,normalization:'l2',chunkingProfile:'p1',taskPair:'query_document'};
const query = {spec,task:'query',vector:[1,0]};
const candidate = (id,overrides={}) => ({id,spec,task:'document',vector:[1,0],tenantId:'t1',deskId:'d1',permitted:true,...overrides});
const scope = {tenantId:'t1',deskId:'d1'};
const window = overrides => ({panelRevision:'panel1',membershipRevision:'narrative1',durationSeconds:3600,eligibleFamilies:100,matchedFamilies:10,health:'healthy',complete:true,...overrides});
const baseline = () => [window(),window(),window()];
const pin = (id,overrides={}) => ({type:'SourceRevision',id,digest:hash(id),visibility:'permitted',...overrides});

test('locators pin the chosen repeated occurrence and preserve UTF-16 coordinates', () => {
  const r=representation('قال 😀 نعم. قال 😀 نعم.');
  const start=r.text.lastIndexOf('قال');
  assert.equal(validateLocator(r,locator(r,start,r.text.length)),true);
  assert(start !== 0);
});
test('stale revisions, wrong quotes and invalid bounds fail exact locator validation', () => {
  const r=representation('The proposal may change.'); const l=locator(r,4,12);
  for (const patch of [{representationHash:hash('old')},{quote:'different'},{start:-1},{end:100},{offsetUnit:'code_point'}])
    assert.throws(() => validateLocator(r,{...l,...patch}));
  assert.throws(() => validateLocator({...r,text:r.text+' changed'},l));
});
test('locators cannot split surrogate pairs even when the slice matches', () => {
  const r=representation('A😀B');
  assert.throws(() => validateLocator(r,locator(r,1,2)),/surrogate/);
  assert.equal(validateLocator(r,locator(r,1,3)),true);
});
test('retrieval scopes candidates before ranking and respects explicit permission', () => {
  const rows=[candidate('foreign',{tenantId:'other',spec:null}),candidate('other-desk',{deskId:'d2'}),candidate('denied',{permitted:false}),candidate('orthogonal',{vector:[0,1]}),candidate('match')];
  const result=rankedEmbeddingCandidates(query,rows,scope);
  assert.deepEqual(result.map(x=>x.id),['match','orthogonal']);
  assert.equal(result[0].status,'retrieval_candidate');
});
test('same dimension with a different model/revision/chunking task is incompatible', () => {
  for (const patch of [{model:'m2'},{revision:'v2'},{chunkingProfile:'p2'},{taskPair:'symmetric'}])
    assert.throws(() => rankedEmbeddingCandidates(query,[candidate('x',{spec:{...spec,...patch}})],scope),/namespace/);
  assert.throws(() => rankedEmbeddingCandidates(query,[candidate('x',{task:'query'})],scope));
});
test('nonfinite, zero and wrong-length embeddings fail instead of generating plausible ranks', () => {
  for (const vector of [[0,0],[NaN,0],[Infinity,1],[1]])
    assert.throws(() => rankedEmbeddingCandidates({...query,vector},[],scope));
  assert.equal(rankedEmbeddingCandidates({...query,vector:[1e200,0]},[candidate('x',{vector:[1e200,0]})],scope)[0].similarity,1);
});
test('attention reports counts and a descriptive comparable-window ratio', () => {
  const result=attentionChange(window({matchedFamilies:20}),baseline());
  assert.equal(result.status,'screened'); assert.equal(result.numerator,20); assert.equal(result.denominator,100);
  assert.equal(result.rate,.2); assert(Math.abs(result.ratio-2)<1e-12);
  assert.match(result.interpretation,/not public opinion/);
});
test('changed panels and failed windows cannot masquerade as changed attention', () => {
  assert.equal(attentionChange(window({panelRevision:'p2'}),baseline()).status,'uncomparable');
  assert.equal(attentionChange(window({membershipRevision:'n2'}),baseline()).status,'uncomparable');
  assert.equal(attentionChange(window({durationSeconds:7200}),baseline()).status,'uncomparable');
  assert.equal(attentionChange(window({complete:false}),baseline()).status,'degraded');
  assert.equal(attentionChange(window(),[window({health:'blocked'}),window(),window()]).status,'degraded');
});
test('low volume/history and impossible counts are explicitly rejected or qualified', () => {
  assert.equal(attentionChange(window({matchedFamilies:1}),baseline()).status,'insufficient');
  assert.equal(attentionChange(window(),[window()]).status,'insufficient');
  assert.equal(attentionChange(window(),[window({eligibleFamilies:10}),window(),window()]).status,'insufficient');
  assert.throws(() => attentionChange(window({matchedFamilies:101}),baseline()));
});
test('a zero baseline has no infinite or invented ratio', () => {
  const result=attentionChange(window(),baseline().map(w=>({...w,matchedFamilies:0})));
  assert.equal(result.status,'screened'); assert.equal(result.ratio,null); assert.equal(result.baselineRate,0);
});
test('manifest comparisons distinguish revision, withdrawal, removal, addition and no change', () => {
  const before=[pin('same'),pin('revised'),pin('withdrawn'),pin('removed')];
  const after=[pin('added'),pin('same'),pin('revised',{digest:hash('new')}),pin('withdrawn',{visibility:'withdrawn'})];
  assert.deepEqual(manifestDelta(before,after).map(x=>[x.id,x.change]),[['added','added'],['removed','removed'],['revised','revised'],['withdrawn','withdrawn']]);
  assert.deepEqual(manifestDelta(before,[...before].reverse()),[]);
  assert.throws(() => manifestDelta([pin('same'),pin('same')],after),/Duplicate/);
});
test('dependency invalidation is transitive, scoped to reachable artifacts and cycle-safe', () => {
  const edge=(artifact,dependency)=>({artifact,dependency,predicate:'depends_on'});
  const edges=[edge('Claim:c','SourceRevision:s'),edge('Assessment:a','Claim:c'),edge('Brief:b','Assessment:a'),edge('Assessment:a','Brief:b'),edge('Brief:unrelated','SourceRevision:other')];
  assert.deepEqual(affectedDependents(edges,['SourceRevision:s']),['Assessment:a','Brief:b','Claim:c']);
  assert.deepEqual(affectedDependents(edges,['SourceRevision:missing']),[]);
});
