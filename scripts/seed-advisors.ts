import { saveAdvisor } from '@/lib/firebase/advisor-service';
import { FALLBACK_ADVISOR_SEEDS } from '@/lib/constants/advisor-configs';

async function main() {
  for (const cfg of FALLBACK_ADVISOR_SEEDS) {
    const out = await saveAdvisor({ ...cfg, version: 1, updatedAt: null });
    console.log(`Seeded advisor ${out.id} v${out.version}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
