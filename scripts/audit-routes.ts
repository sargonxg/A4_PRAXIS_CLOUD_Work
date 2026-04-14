/**
 * PRAXIS Route Audit Script
 * Validates that all AI routes follow the standard pattern.
 * Run with: npx tsx scripts/audit-routes.ts
 */
import fs from 'fs';
import path from 'path';

const AI_ROUTES_DIR = path.join(__dirname, '../src/app/api/ai');
const CREDIT_COSTS_FILE = path.join(__dirname, '../src/lib/api/with-credits.ts');

// Read credit costs source to validate keys
const creditsSrc = fs.readFileSync(CREDIT_COSTS_FILE, 'utf-8');

// Find all route files
const routeDirs = fs.readdirSync(AI_ROUTES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const issues: string[] = [];
let passed = 0;

for (const dir of routeDirs) {
  const routePath = path.join(AI_ROUTES_DIR, dir, 'route.ts');
  if (!fs.existsSync(routePath)) continue;

  const src = fs.readFileSync(routePath, 'utf-8');
  const checks = [
    { name: 'withAuth wrapper',        test: src.includes('withAuth(') },
    { name: 'checkAndDeductCredits',   test: src.includes('checkAndDeductCredits') },
    { name: 'isServerDemoMode check',  test: src.includes('isServerDemoMode()') },
    { name: 'handleRouteError',        test: src.includes('handleRouteError(') },
    { name: 'generateText/streamText', test: src.includes('generateText(') || src.includes('streamText(') },
    { name: 'maxDuration export',      test: src.includes('maxDuration') },
  ];

  // Check credit key exists in AI_CREDIT_COSTS
  const creditMatch = src.match(/checkAndDeductCredits(?:ForUid)?\s*\(\s*(?:uid,\s*)?['"]([^'"]+)['"]/);
  if (creditMatch) {
    const key = creditMatch[1];
    if (!creditsSrc.includes(`'${key}'`)) {
      issues.push(`${dir}: credit key '${key}' NOT FOUND in AI_CREDIT_COSTS`);
    }
  }

  const failures = checks.filter(c => !c.test);
  if (failures.length > 0) {
    issues.push(`${dir}: missing ${failures.map(f => f.name).join(', ')}`);
  } else {
    passed++;
  }
}

console.log(`\n✅ ${passed}/${routeDirs.length} routes pass all checks`);
if (issues.length > 0) {
  console.log(`\n❌ Issues found:`);
  issues.forEach(i => console.log(`  - ${i}`));
} else {
  console.log('\n🎉 All routes pass!');
}
