import { saveAdvisor } from '@/lib/firebase/advisor-service';
import { advisorRuntimeSeeds } from '@/lib/agents/registry';

async function main() {
  for (const cfg of advisorRuntimeSeeds()) {
    const out = await saveAdvisor({ ...cfg, version: 1, updatedAt: null });
    console.log(`Seeded advisor ${out.id} v${out.version}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
