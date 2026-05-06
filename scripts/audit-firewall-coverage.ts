import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];
const calibration = readFileSync(join(process.cwd(), 'src/lib/api/with-calibration.ts'), 'utf8');
const firewall = readFileSync(join(process.cwd(), 'src/lib/api/with-firewall.ts'), 'utf8');
const claims = readFileSync(join(process.cwd(), 'src/lib/firebase/claims-service.ts'), 'utf8');

for (const marker of ['withFirewall({', 'contextSnapshot', 'contextAware.headers.forEach']) {
  if (!calibration.includes(marker)) failures.push(`withCalibration missing firewall marker: ${marker}`);
}

for (const marker of ['extractFirewallClaims', 'verifyFirewallClaim', 'persistClaimTrust', 'X-Praxis-Firewall-Claims']) {
  if (!firewall.includes(marker)) failures.push(`with-firewall missing marker: ${marker}`);
}

for (const marker of ['computeClaimTrustScore', 'claimTrustId', "collection('claims')"]) {
  if (!claims.includes(marker)) failures.push(`claim Trust Score persistence missing marker: ${marker}`);
}

if (failures.length > 0) {
  console.error('Firewall coverage audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Firewall coverage audit passed.');
