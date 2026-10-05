import { readFileSync, statSync } from 'node:fs';
import { evaluateSignal, signalDevelopmentExamples } from '../src/lib/signal/evaluation';

const arg = process.argv[2];
try {
  if (!arg || !['--demo', '--demo-dataset'].includes(arg) && process.argv.length !== 3) throw new Error('Usage: npx tsx scripts/evaluate-signal.ts <dataset.json> | --demo | --demo-dataset');
  if (arg === '--demo-dataset') process.stdout.write(JSON.stringify(signalDevelopmentExamples(), null, 2) + '\n');
  else {
    if (arg !== '--demo' && statSync(arg).size > 32 * 1024 * 1024) throw new Error('Dataset exceeds the 32 MB evaluation limit.');
    const dataset: unknown = arg === '--demo' ? signalDevelopmentExamples() : JSON.parse(readFileSync(arg, 'utf8'));
    process.stdout.write(JSON.stringify(evaluateSignal(dataset), null, 2) + '\n');
  }
} catch (error) {
  process.stderr.write(`SIGNAL evaluation failed: ${error instanceof Error ? error.message : 'Invalid dataset'}\n`);
  process.exitCode = 1;
}
