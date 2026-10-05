import { test, expect, request as playwrightRequest, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials, canaryCredentialSkipReason } from './helpers/auth';
import { buildSignalCoverageGlobe } from '../../src/lib/signal/coverage-globe';
import { buildSignalEvidenceNetwork } from '../../src/lib/signal/visualizations';
import type { SignalDesk } from '../../src/lib/signal/schema';

// Real browser software WebGL, with normal TLS verification retained.
test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }, ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } } : {}) });
const origin=process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const upstream=process.env.SIGNAL_LOCAL_UPSTREAM;
const created:string[]=[];
let cookie='';
async function appOrigin(page:Page) {
  if(!upstream)return;
  await page.route(`https://${new URL(origin).host}/**`,async route=>{
    const incoming=route.request(),url=new URL(incoming.url());
    try { const response=await page.request.fetch(new URL(url.pathname+url.search,upstream).toString(),{method:incoming.method(),headers:{...await incoming.allHeaders(),connection:'close','x-forwarded-host':new URL(origin).host,'x-forwarded-proto':'https'},...(incoming.postDataBuffer()?{data:incoming.postDataBuffer()!}:{}),maxRedirects:0,maxRetries:incoming.method()==='GET'?2:0});await route.fulfill({response}); }
    catch { await route.abort().catch(()=>{}); }
  });
}
async function api(page:Page,method:string,path:string,body?:Record<string,unknown>){
  return page.evaluate(async({method,path,body})=>{const response=await fetch(path,{method,credentials:'include',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return{status:response.status,body:await response.json()};},{method,path,body});
}
async function mutate(page:Page,desk:SignalDesk|undefined,action:string,values:Record<string,unknown>={}) {
  const result=await api(page,'POST','/api/signal',{action,...(desk?{deskId:desk.id,expectedVersion:desk.version}:{}),...values});
  expect(result.status,'Actual owner API mutation succeeds').toBeLessThan(300);
  if(action==='create')created.push(result.body.desk.id);
  return result.body.desk as SignalDesk;
}
async function login(page:Page){await appOrigin(page);await authenticateFirebaseCanary(page,undefined,'/app',{expectComposer:false});cookie=(await page.context().cookies(origin)).map(item=>`${item.name}=${item.value}`).join('; ');}
async function createDesk(page:Page){return mutate(page,undefined,'create',{name:`SIGNAL synthetic visualization QA ${Date.now()}`,question:'How do the owned synthetic sources frame a future consultation?',audience:'Private browser QA',scope:{kind:'theatre',countries:['BR','JP'],label:'Synthetic Brazil Japan panel'},languages:['en','pt'],windowDays:14});}
async function seed(page:Page,desk:SignalDesk){
  const text='Synthetic source: consultation starts next month; adoption has not occurred.';
  for(const [i,language] of ['en','pt','en'].entries()) desk=await mutate(page,desk,'capture',{title:`Synthetic network source ${i+1}`,text:i===1?'Fonte sintética: a consulta começa no próximo mês; a adoção ainda não ocorreu.':text,...(i<2?{coverageCountry:i?'JP':'BR'}:{}),url:`https://${i?'regional.example.net':'official.example.org'}/signal-qa/${Date.now()}`,language,kind:'original_text',publicationTime:null,synthetic:true,rights:{basis:'Owned synthetic browser fixture; redistribution permitted',allowExport:true}});
  const source=desk.sources[0];desk=await mutate(page,desk,'propose',{sourceRevisionId:source.id,proposition:'Synthetic minister distinguishes consultation from adoption.',speaker:'Fictional minister',quote:text,start:0,end:text.length,polarity:'negative',modality:'denied',conditions:'Synthetic QA source only',time:'Next month',place:'Brazil',frame:'Consultation versus adoption'});
  const claim=desk.claims.at(-1)!;desk=await mutate(page,desk,'review',{claimId:claim.id,digest:claim.digest,decision:'accepted',rationale:'Exact owned synthetic source supports this attributed limited reading.'});
  desk=await mutate(page,desk,'proposeNarrative',{title:'Synthetic consultation narrative',frame:'The exact synthetic source distinguishes future consultation from adoption.',claimIds:[claim.id],alternatives:['Different procedural meanings of consultation may exist.']});
  const narrative=desk.narratives!.at(-1)!;desk=await mutate(page,desk,'reviewInterpretation',{targetId:narrative.id,digest:narrative.digest,decision:'accepted',rationale:'Accepted bounded source interpretation, not a prevalence or event-truth inference.'});
  return desk;
}
async function openTab(page:Page,desk:SignalDesk,view:string){await page.goto(`/signal?desk=${desk.id}&view=${view}`);await expect(page.getByRole('heading',{level:2,name:desk.name,exact:true})).toBeVisible({timeout:30000});}
test.afterAll(async()=>{
  if(!created.length)return;
  const client=await playwrightRequest.newContext({baseURL:upstream??origin,extraHTTPHeaders:{Cookie:cookie}});
  try{for(const id of created){const current=await client.get(`/api/signal?deskId=${id}`);if(current.status()===404)continue;expect(current.status()).toBe(200);const value=await current.json();const deleted=await client.delete(`/api/signal?deskId=${id}&expectedVersion=${value.desk.version}`);expect(deleted.status(),'Scoped fixture deletion').toBeLessThan(300);}}
  catch(error){if(error instanceof Error&&error.message.startsWith('apiRequestContext.'))throw new Error('Fixture cleanup transport failed; no request headers are recorded.');throw error;}
  finally{await client.dispose();}
});

test('actual 3D network: empty, camera, raycast, exact evidence, filters, landscape and withdrawal',async({page})=>{
  test.skip(!hasFirebaseCanaryCredentials(),canaryCredentialSkipReason());test.setTimeout(240000);
  const errors:string[]=[];const graphExternalRequests:string[]=[];
  page.on('pageerror',error=>errors.push(error.name));
  page.on('request',request=>{const url=new URL(request.url());if(/three|graph|d3|unpkg|jsdelivr/i.test(url.hostname)&&url.host!==new URL(origin).host)graphExternalRequests.push(url.hostname);});
  await login(page);let desk=await createDesk(page);await openTab(page,desk,'Narratives');
  const network=page.getByTestId('signal-evidence-network');await expect(network.getByText(/No captured evidence yet/)).toBeVisible();
  await openTab(page,desk,'Coverage');await expect(page.getByTestId('signal-media-landscape').getByText(/No sources captured yet/)).toBeVisible();
  desk=await seed(page,desk);await openTab(page,desk,'Coverage');
  const globe=page.getByTestId('signal-coverage-globe');const globeScene=globe.getByTestId('signal-globe-webgl');
  await expect(globeScene.locator('canvas')).toBeVisible({timeout:30000});
  expect(await globeScene.locator('canvas').evaluate(canvas=>(canvas as HTMLCanvasElement).getContext('webgl2') instanceof WebGL2RenderingContext),'Actual geographic globe WebGL2').toBe(true);
  await mkdir('output/signal',{recursive:true});
  await globeScene.screenshot({path:'output/signal/globe-desktop.png',animations:'disabled'});
  const globeInitial=await globeScene.getAttribute('data-camera');await globe.getByRole('button',{name:'Rotate globe left',exact:true}).click();await expect(globeScene).not.toHaveAttribute('data-camera',globeInitial!);await globe.getByRole('button',{name:'Zoom globe in',exact:true}).click();await globe.getByRole('button',{name:'Reset globe view',exact:true}).click();await expect(globeScene).toHaveAttribute('data-camera',globeInitial!);
  const coverage=buildSignalCoverageGlobe(desk),brazil=coverage.countries.find(country=>country.code==='BR')!;
  const globeBox=(await globeScene.locator('canvas').boundingBox())!;const globeCamera=new THREE.PerspectiveCamera(40,globeBox.width/globeBox.height,0.1,3000);globeCamera.position.fromArray(globeInitial!.split(',').map(Number));globeCamera.lookAt(0,0,0);globeCamera.updateMatrixWorld();
  const latitude=THREE.MathUtils.degToRad(brazil.latitude!),longitude=THREE.MathUtils.degToRad(brazil.longitude!);const globePoint=new THREE.Vector3(102.2*Math.cos(latitude)*Math.sin(longitude),102.2*Math.sin(latitude),102.2*Math.cos(latitude)*Math.cos(longitude)).project(globeCamera);
  await globeScene.locator('canvas').click({position:{x:(globePoint.x+1)/2*globeBox.width,y:(1-globePoint.y)/2*globeBox.height}});
  await expect(globe.getByTestId('signal-globe-selection').getByRole('heading',{name:'Brazil (BR)',exact:true})).toBeVisible();
  await expect(globe.getByTestId('signal-globe-selection')).toContainText('1 current revisions');
  await globe.getByRole('list',{name:'Coverage globe exact source revisions'}).getByRole('button').filter({hasText:desk.sources[0].title}).click();await expect(page.getByLabel('Inspect source revision',{exact:true})).toHaveValue(desk.sources[0].id);
  await page.getByRole('tab',{name:'Coverage',exact:true}).click();await globe.getByRole('list',{name:'Coverage globe countries'}).getByRole('button').filter({hasText:'Japan (JP)'}).click();await expect(globe.getByTestId('signal-globe-selection')).toContainText('1 current revisions');
  await globe.getByText('Unmapped sources (1 active / 1 retained)',{exact:true}).click();await expect(globe.getByRole('list',{name:'Globe unmapped source revisions'}).getByRole('button').filter({hasText:desk.sources[2].title})).toBeVisible();
  await page.getByRole('tab',{name:'Narratives',exact:true}).click();
  const scene=network.getByTestId('signal-network-webgl');await expect(scene.locator('canvas')).toBeVisible({timeout:30000});
  expect(await scene.locator('canvas').evaluate(canvas=>(canvas as HTMLCanvasElement).getContext('webgl2') instanceof WebGL2RenderingContext),'Actual verified WebGL2 renderer').toBe(true);
  await scene.screenshot({path:'output/signal/network-desktop.png',animations:'disabled'});
  const initial=await scene.getAttribute('data-camera');await network.getByRole('button',{name:'Rotate right',exact:true}).click();await expect(scene).not.toHaveAttribute('data-camera',initial!);
  await network.getByRole('button',{name:'Zoom in',exact:true}).click();const zoomed=await scene.getAttribute('data-camera');expect(zoomed).not.toBe(initial);
  await network.getByRole('button',{name:'Reset view',exact:true}).click();await expect(scene).toHaveAttribute('data-camera',initial!);
  // Project an actual canonical source through the observable camera, then use real raycasting.
  const projection=buildSignalEvidenceNetwork(desk);const positions=projection.nodes.map(node=>new THREE.Vector3(node.position.x,node.position.y,node.position.z));
  const bounds=new THREE.Box3().setFromPoints(positions),center=bounds.getCenter(new THREE.Vector3());const canvasBox=(await scene.locator('canvas').boundingBox())!;
  const camera=new THREE.PerspectiveCamera(45,canvasBox.width/canvasBox.height,0.1,10000);camera.position.fromArray(initial!.split(',').map(Number));camera.lookAt(center);camera.updateMatrixWorld();
  const target=projection.nodes.find(node=>node.sourceRevisionId===desk.sources[0].id&&node.kind==='source')!;const screen=new THREE.Vector3(target.position.x,target.position.y,target.position.z).project(camera);
  await scene.locator('canvas').click({position:{x:(screen.x+1)/2*canvasBox.width,y:(1-screen.y)/2*canvasBox.height}});
  await expect(network.getByTestId('signal-network-selection').getByRole('heading',{name:desk.sources[0].title,exact:true})).toBeVisible();
  await network.getByRole('button',{name:'Inspect exact evidence',exact:true}).click();await expect(page.getByLabel('Inspect source revision',{exact:true})).toHaveValue(desk.sources[0].id);
  await page.getByRole('tab',{name:'Narratives',exact:true}).click();
  await network.getByRole('list',{name:'Evidence network nodes'}).getByRole('button').filter({hasText:'Synthetic consultation narrative'}).click();
  await network.getByRole('button',{name:'Inspect exact interpretation',exact:true}).click();
  await expect(page.locator(`#signal-interpretation-${desk.narratives![0].id}`)).toBeFocused();
  await network.getByLabel('Evidence network kind',{exact:true}).selectOption('claim');await expect(network.getByRole('list',{name:'Evidence network nodes'}).getByRole('button')).toHaveCount(1);
  await network.getByLabel('Evidence network kind',{exact:true}).selectOption('all');await network.getByLabel('Evidence network language',{exact:true}).selectOption('pt');await expect(network.getByRole('list',{name:'Evidence network nodes'}).getByRole('button')).toHaveCount(1);
  await network.getByLabel('Evidence network language',{exact:true}).selectOption('all');await network.getByLabel('Find evidence network node',{exact:true}).fill('absent node 999');await expect(network.getByText(/No nodes match these filters/)).toBeVisible();await network.getByLabel('Find evidence network node',{exact:true}).fill('');
  await page.getByRole('tab',{name:'Coverage',exact:true}).click();const landscape=page.getByTestId('signal-media-landscape');await expect(landscape.getByTestId('signal-landscape-chart')).toBeVisible();await landscape.getByTestId('signal-landscape-chart').screenshot({path:'output/signal/landscape-desktop.png',animations:'disabled'});await landscape.getByRole('list',{name:'Media landscape source groups'}).getByRole('button').filter({hasText:'official.example.org'}).click();await landscape.getByRole('list',{name:'Media landscape exact source revisions'}).getByRole('button').filter({hasText:desk.sources[0].title}).click();await expect(page.getByLabel('Inspect source revision',{exact:true})).toHaveValue(desk.sources[0].id);
  const beforeFeedback=structuredClone({sources:desk.sources,claims:desk.claims,reviews:desk.reviews});
  const feedbackMessage='Synthetic browser QA: source-linked graph controls and exact evidence drilldown are usable.';
  await page.getByText('Private feedback',{exact:true}).click();
  await page.getByLabel('Feedback area',{exact:true}).selectOption({label:'Narratives'});
  await page.getByLabel('Feedback category',{exact:true}).selectOption('visualization');
  await page.getByLabel('Feedback rating',{exact:true}).selectOption('5');
  await page.getByLabel('Feedback message',{exact:true}).fill(feedbackMessage);
  await page.getByLabel('This is test feedback',{exact:true}).check();
  await page.getByRole('button',{name:'Save private feedback',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Feedback saved privately to this desk.'})).toBeVisible();
  const feedbackDownload=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export private feedback JSON',exact:true}).click();
  expect((await feedbackDownload).suggestedFilename()).toMatch(/\.json$/);
  await page.reload();
  await page.getByText('Private feedback',{exact:true}).click();
  await expect(page.getByText(feedbackMessage,{exact:true})).toBeVisible();
  const persistedFeedback=await api(page,'GET',`/api/signal?deskId=${desk.id}`);desk=persistedFeedback.body.desk as SignalDesk;
  expect({sources:desk.sources,claims:desk.claims,reviews:desk.reviews},'Saved feedback leaves canonical evidence and reviews unchanged').toEqual(beforeFeedback);
  desk=await mutate(page,desk,'withdraw',{sourceRevisionId:desk.sources[0].id});await openTab(page,desk,'Narratives');await network.getByLabel('Evidence network review state',{exact:true}).selectOption('stale');await expect(network.getByRole('list',{name:'Evidence network nodes'}).getByRole('button')).toHaveCount(2);await network.getByLabel('Evidence network review state',{exact:true}).selectOption('all');
  await page.setViewportSize({width:390,height:844});await mkdir('output/signal',{recursive:true});await scene.screenshot({path:'output/signal/network-mobile.png',animations:'disabled'});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.getByRole('tab',{name:'Coverage',exact:true}).click();
  await globe.getByRole('list',{name:'Coverage globe countries'}).getByRole('button').filter({hasText:'Brazil (BR)'}).click();
  await expect(globe.getByTestId('signal-globe-selection')).toContainText('0 current revisions');
  await globe.getByLabel('Include country history and withdrawn revisions',{exact:true}).check();
  await expect(globe.getByRole('list',{name:'Coverage globe exact source revisions'}).getByRole('button').filter({hasText:'withdrawn'})).toHaveCount(1);
  await globeScene.screenshot({path:'output/signal/globe-mobile.png',animations:'disabled'});
  await landscape.getByRole('list',{name:'Media landscape source groups'}).getByRole('button').filter({hasText:'official.example.org'}).click();await expect(landscape.getByTestId('signal-landscape-selection').getByText(/No active revisions match/)).toBeVisible();await landscape.getByLabel('Include historical and withdrawn revisions',{exact:true}).check();await expect(landscape.getByRole('list',{name:'Media landscape exact source revisions'}).getByRole('button').filter({hasText:'withdrawn'})).toHaveCount(1);await landscape.getByTestId('signal-landscape-chart').screenshot({path:'output/signal/landscape-mobile.png',animations:'disabled'});
  expect(graphExternalRequests,'No graph code or data is fetched from a third-party CDN').toEqual([]);expect(errors,'No browser runtime exceptions').toEqual([]);
  await writeFile('output/signal/visualization-browser-summary.json',JSON.stringify({actualWebGL2:true,geographicGlobe:true,explicitCountryCoverage:true,unmappedSources:true,cameraControls:true,raycastSelection:true,scopedSourceDrilldown:true,withdrawalVisible:true,mobileOverflow:false,runtimeExceptions:errors.length,graphExternalRequests},null,2));
});

test('GPU unavailable: honest interactive 2D and accessible-list fallback',async({page})=>{
  test.skip(!hasFirebaseCanaryCredentials(),canaryCredentialSkipReason());test.setTimeout(120000);
  await page.addInitScript(()=>{const getContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,...args:Parameters<typeof getContext>){if(args[0]==='webgl'||args[0]==='webgl2'||args[0]==='experimental-webgl')return null;return getContext.apply(this,args);} as typeof getContext;});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.name));await login(page);let desk=await createDesk(page);desk=await seed(page,desk);await openTab(page,desk,'Narratives');
  await openTab(page,desk,'Coverage');const globe=page.getByTestId('signal-coverage-globe');
  await expect(globe.getByText(/3D globe is unavailable on this device/)).toBeVisible({timeout:30000});
  await expect(globe.getByTestId('signal-globe-world-map')).toBeVisible();
  await globe.getByTestId('signal-globe-world-map').getByRole('button',{name:/^Select coverage Brazil:/}).focus();
  await page.keyboard.press('Enter');
  await expect(globe.getByTestId('signal-globe-selection').getByRole('heading',{name:'Brazil (BR)',exact:true})).toBeVisible();
  await globe.getByRole('list',{name:'Coverage globe exact source revisions'}).getByRole('button').filter({hasText:desk.sources[0].title}).click();
  await expect(page.getByLabel('Inspect source revision',{exact:true})).toHaveValue(desk.sources[0].id);
  await page.getByRole('tab',{name:'Narratives',exact:true}).click();
  const network=page.getByTestId('signal-evidence-network');await expect(network.getByText(/3D is unavailable on this device/)).toBeVisible({timeout:30000});await expect(network.getByTestId('signal-network-2d')).toBeVisible();
  await network.getByRole('list',{name:'Evidence network nodes'}).getByRole('button').filter({hasText:desk.sources[0].title}).click();await network.getByRole('button',{name:'Inspect exact evidence',exact:true}).click();await expect(page.getByLabel('Inspect source revision',{exact:true})).toHaveValue(desk.sources[0].id);expect(errors).toEqual([]);
});
