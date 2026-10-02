/** Offline controlled demonstration. No Firebase, model, queue or provider requests. */
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PDFParse } from 'pdf-parse';
import dossier from '../tests/fixtures/example-advisory-dossier.json';
import { projectFirestore } from '../tests/helpers/project-firestore';
import { createProject, getProject, mutateProject } from '../src/lib/projects/service';
import { sanitizeCapsule } from '../src/lib/context/capsule-service';
import { exportWorkProductDocx, exportWorkProductPdf, normalizeWorkProductExportInput } from '../src/lib/drafting/export';

async function main() {
  const output = join('output', 'projects', `demonstration-${Date.now()}`);
  await mkdir(output, { recursive: true });
  const fixture = projectFirestore();
  fixture.records.set('users/fixture-analyst', { uid: 'fixture-analyst' });
  const db = fixture.db;
  const capsule = sanitizeCapsule({ ownerUid: 'fixture-analyst', capsuleId: 'example-advisory', label: dossier.title, version: 1, summary: dossier.sources.slice(0, 2).map((source) => source.text).join('\n\n'), coreRefs: { sourceCoreIds: ['EA-D1', 'EA-D8'], documentCoreIds: ['EA-D1', 'EA-D8'] } });
  fixture.records.set('users/fixture-analyst/capsules/example-advisory', capsule);
  const project = await createProject('fixture-analyst', { scope: dossier.scope, operationId: 'demonstration-create' }, { db });
  const attached = await mutateProject('fixture-analyst', project.projectId, { action: 'attach', capsuleId: capsule.capsuleId, version: 1, role: 'situation', expectedRevision: project.revision, operationId: 'demonstration-attach' }, { db });
  let saved = attached;
  for (const [title, outputKind] of [['Reporting-rule brief', 'brief'], ['Attributed stakeholder positions', 'stakeholder-map']]) saved = await mutateProject('fixture-analyst', saved.projectId, { action: 'add-work', title, output: outputKind, instruction: 'Keep funding uncertain, pilot optional and dates proposed. Attribute the industry transition request.', expectedRevision: saved.revision, operationId: `demonstration-${outputKind}` }, { db });
  const oldWork = structuredClone(saved.workItems);
  fixture.records.set('users/fixture-analyst/capsules/example-advisory', { ...capsule, summary: dossier.sources.map((source) => source.text).join('\n\n') });
  const changed = await getProject('fixture-analyst', saved.projectId, { db });
  if (changed?.contextStatus[0].status !== 'changed' || JSON.stringify(changed.workItems) !== JSON.stringify(oldWork)) throw new Error('Staleness/history demonstration failed');
  const examples = [];
  for (const [name, repeat] of [['short', 1], ['long', 12]] as const) {
    const normalized = normalizeWorkProductExportInput({ title: dossier.title, format: 'pdf', outputTarget: 'brief', sections: [
      { heading: 'Controlled fixture draft — as of 2026-01-15 — human review pending', body: 'This is supplied fixture text, not a generated model answer or approved deliverable.' },
      { heading: 'Source assertions and positions', body: Array.from({ length: repeat }, () => dossier.sources.map((source) => `[${source.id}] ${source.text}`).join('\n\n')).join('\n\n') },
      { heading: 'Unresolved questions', body: 'Funding remains undecided. Capital secured, allocated or spent is unknown. No adopted start date is established. A pilot remains an optional recommendation subject to funding.' },
    ], sourceCards: dossier.sources.map((source) => ({ id: source.id, title: `${source.id} v${source.version} — synthetic — published ${source.publicationDate}`, url: `https://example.invalid/${source.id}` })) });
    const pdf = exportWorkProductPdf(normalized);
    const docx = await exportWorkProductDocx(normalized);
    await writeFile(join(output, `${name}.pdf`), pdf); await writeFile(join(output, `${name}.docx`), docx);
    const parser = new PDFParse({ data: new Uint8Array(pdf) });
    try {
      const text = await parser.getText();
      await writeFile(join(output, `${name}-extracted.txt`), text.text);
      const rendered = await parser.getScreenshot({ scale: 1.4, imageBuffer: true, imageDataUrl: false });
      for (const page of rendered.pages) await writeFile(join(output, `${name}-page-${page.pageNumber}.png`), page.data);
      examples.push({ name, pages: rendered.total, pdfSha256: createHash('sha256').update(pdf).digest('hex'), docxSha256: createHash('sha256').update(docx).digest('hex') });
    } finally { await parser.destroy(); }
  }
  await writeFile(join(output, 'receipt.json'), JSON.stringify({ at: new Date().toISOString(), boundary: 'Real project service and export helpers; transactional in-memory storage fixture, pre-seeded capsule, controlled source excerpts. No real login/intake/model/worker/artifact persistence/portable import.', fixtureSha256: createHash('sha256').update(JSON.stringify(dossier)).digest('hex'), project: changed, examples, modelCalls: 0, humanUsefulnessRatings: null }, null, 2));
  console.log(JSON.stringify({ output, projectId: saved.projectId, state: 'drafts-persisted-in-fixture-context-change-detected', examples, modelCalls: 0 }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : 'Demonstration failed'); process.exitCode = 1; });
