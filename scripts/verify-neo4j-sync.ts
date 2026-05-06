import { pathToFileURL } from 'node:url';
import { verifyNeo4jSync } from '@/lib/graph/neo4j-drift-verifier';

function readArgs(argv: string[]) {
  const caseIds: string[] = [];
  let production = false;
  let sampleSize = 10;
  let thresholdPercent = 0;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--production') production = true;
    if (arg === '--all') caseIds.length = 0;
    if (arg === '--case' && argv[i + 1]) caseIds.push(argv[++i]);
    if (arg === '--sample-size' && argv[i + 1]) sampleSize = Number(argv[++i]);
    if (arg === '--threshold-percent' && argv[i + 1]) thresholdPercent = Number(argv[++i]);
  }

  return { caseIds: caseIds.length > 0 ? caseIds : undefined, production, sampleSize, thresholdPercent };
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const report = await verifyNeo4jSync(readArgs(argv));
  console.log(JSON.stringify(report, null, 2));
  return report.status === 'drift' ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
