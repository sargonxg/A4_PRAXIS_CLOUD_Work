// Integrity checks for the portable handoff; not a substitute for production QA.
import {readFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {resolve,dirname,join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const files=[];
function walk(path){for(const name of readdirSync(path)){if(['.git','node_modules','qa'].includes(name)||name.startsWith('.env')||/\.(sqlite|db)(-|$)/.test(name))continue;const p=join(path,name);if(statSync(p).isDirectory())walk(p);else files.push(p);}}
walk(root);
const markdown=files.filter(p=>p.endsWith('.md'));
for(const path of markdown){const text=readFileSync(path,'utf8');assert(!text.includes('\uFFFD'),'Invalid character in '+path);for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){const target=match[1];if(/^(https?:|mailto:|#)/.test(target))continue;assert(existsSync(resolve(dirname(path),target.split('#')[0])),'Missing link '+target+' in '+path);}}
const portable=p=>relative(root,p).split(sep).join('/');
const phases=files.map(portable).filter(p=>/^codex\/phases\/\d\d_.*\.md$/.test(p));
assert.equal(phases.length,12);for(let i=0;i<12;i++)assert.equal(phases.filter(p=>p.includes('/'+String(i).padStart(2,'0')+'_')).length,1);
for(const path of files.filter(p=>p.endsWith('.json')))JSON.parse(readFileSync(path,'utf8'));
const fixtures=JSON.parse(readFileSync(join(root,'fixtures/synthetic-cases.json'),'utf8'));
assert(fixtures.synthetic&&fixtures.notAGoldEvaluationSet);assert.equal(fixtures.cases.length,6);
assert(new Set(fixtures.cases.map(x=>x.countryCode)).size>=3);assert(new Set(fixtures.cases.map(x=>x.language)).size>=2);
for(const c of fixtures.cases){assert(c.synthetic);assert.equal(createHash('sha256').update(c.body).digest('hex'),c.representationHash);assert.equal(c.locator.offsetUnit,'utf16_code_unit');assert.equal(c.body.slice(c.locator.start,c.locator.end),c.locator.quote);assert(c.intendedReading&&c.forbiddenInference);}
const register=JSON.parse(readFileSync(join(root,'research/source-register.json'),'utf8'));
const ids=new Set(register.sources.map(s=>s.id));
assert.equal(ids.size,23);assert.equal(register.sources.length,23);
for(let i=1;i<=23;i++)assert(ids.has('R'+String(i).padStart(2,'0')));
for(const source of register.sources){assert.equal(new URL(source.url).protocol,'https:');assert.equal(source.checkedOn,'2026-10-05');assert(source.implementationNote);}
assert.equal(register.liveEndpointsValidated,false);assert.equal(register.modelsOrDatasetsBundled,false);
const access=JSON.parse(readFileSync(join(root,'research/provider-access-plan.json'),'utf8'));
assert.equal(new Set(access.providers.map(p=>p.id)).size,8);
for(const p of access.providers){assert.equal(p.liveValidated,false);assert.equal(p.credentialsIncluded,false);assert.equal(p.enabledByThisKit,false);p.references.forEach(id=>assert(ids.has(id)));}
const release=JSON.parse(readFileSync(join(root,'RELEASE.json'),'utf8'));
assert.equal(release.version,'0.2.0');assert.equal(release.markdownFileCount,markdown.length);
assert.equal(release.phaseCount,phases.length);assert.equal(release.additionalPrimarySourceCount,ids.size);
assert.equal(release.verification.productionIntegration,false);
assert.equal(release.verification.windowsScriptsExecuted,false);
if(process.argv.includes('--verify-manifest')){
 const lines=readFileSync(join(root,'MANIFEST.sha256'),'utf8').trim().split(/\r?\n/);
 const names=new Set();
 for(const line of lines){const m=/^([a-f0-9]{64})  (.+)$/.exec(line);assert(m,'Invalid manifest line');const [_,expected,name]=m;
  assert(!name.includes('\\')&&!name.startsWith('/')&&!name.split('/').includes('..'),'Unsafe manifest path');
  assert(!names.has(name),'Duplicate manifest entry');names.add(name);
  assert.equal(createHash('sha256').update(readFileSync(join(root,name))).digest('hex'),expected,'Hash mismatch: '+name);
 }
 const expected=files.map(portable).filter(p=>p!=='MANIFEST.sha256');
 assert.deepEqual([...names].sort(),expected.sort(),'Manifest file set mismatch');
 console.log(`Manifest verified: ${names.size} file hashes.`);
}
console.log(`Kit integrity passed: ${markdown.length} Markdown files, 12 phases, 23 additional primary references, 8 planned source adapters and 6 exact-span synthetic cases.`);
