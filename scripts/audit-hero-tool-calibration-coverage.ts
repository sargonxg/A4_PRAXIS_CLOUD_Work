import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { TOOL_REGISTRY } from '../src/lib/constants/tool-registry';

const ROOT = process.cwd();
const ROUTE_EXPORT = /export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=\s*([A-Za-z_$][\w$]*)/g;

interface Finding {
  file: string;
  line: number;
  message: string;
}

function lineNumber(content: string, index: number): number {
  return content.slice(0, Math.max(0, index)).split('\n').length;
}

function registryLine(toolId: string): number {
  const registryFile = join(ROOT, 'src/lib/constants/tool-registry.ts');
  const content = readFileSync(registryFile, 'utf8');
  const index = content.indexOf(`id: '${toolId}'`);
  return index === -1 ? 1 : lineNumber(content, index);
}

function relativePath(file: string): string {
  return relative(ROOT, file).replace(/\\/g, '/');
}

function routeFileFor(aiRoute: string): string {
  const routePath = aiRoute.replace(/^\/+/, '').split('/');
  return join(ROOT, 'src/app', ...routePath, 'route.ts');
}

const findings: Finding[] = [];
const heroTools = TOOL_REGISTRY.filter((tool) => tool.surface === 'hero' && tool.visible);

for (const tool of heroTools) {
  if (!tool.tier) {
    findings.push({
      file: 'src/lib/constants/tool-registry.ts',
      line: registryLine(tool.id),
      message: `${tool.id} is a visible hero tool and must declare tier`,
    });
    continue;
  }

  if (tool.tier !== 'calibrated-ai' && tool.tier !== 'deterministic-structural') {
    findings.push({
      file: 'src/lib/constants/tool-registry.ts',
      line: registryLine(tool.id),
      message: `${tool.id} has unsupported tier ${String(tool.tier)}`,
    });
    continue;
  }

  if (!tool.aiRoute) {
    findings.push({
      file: 'src/lib/constants/tool-registry.ts',
      line: registryLine(tool.id),
      message: `${tool.id} is a visible hero tool and must point to an aiRoute`,
    });
    continue;
  }

  const routeFile = routeFileFor(tool.aiRoute);
  if (!existsSync(routeFile)) {
    findings.push({
      file: 'src/lib/constants/tool-registry.ts',
      line: registryLine(tool.id),
      message: `${tool.id} points to missing aiRoute file ${relativePath(routeFile)}`,
    });
    continue;
  }

  const content = readFileSync(routeFile, 'utf8');
  const exports = [...content.matchAll(ROUTE_EXPORT)];
  const calibratedExport = exports.find((match) => match[2] === 'withCalibration');
  const bareAuthExport = exports.find((match) => match[2] === 'withAuth');

  if (tool.tier === 'calibrated-ai' && calibratedExport) continue;
  if (tool.tier === 'deterministic-structural' && bareAuthExport && !calibratedExport) continue;

  const reference = calibratedExport ?? bareAuthExport ?? exports[0];
  findings.push({
    file: relativePath(routeFile),
    line: reference ? lineNumber(content, reference.index ?? 0) : 1,
    message: tool.tier === 'calibrated-ai'
      ? (bareAuthExport
        ? `${tool.id} is tier calibrated-ai but ${tool.aiRoute} exports a bare withAuth handler`
        : `${tool.id} is tier calibrated-ai but ${tool.aiRoute} does not export a withCalibration-wrapped handler`)
      : (calibratedExport
        ? `${tool.id} is tier deterministic-structural but ${tool.aiRoute} exports a withCalibration handler`
        : `${tool.id} is tier deterministic-structural but ${tool.aiRoute} does not export a bare withAuth handler`),
  });
}

if (findings.length > 0) {
  console.error('[audit:hero-tool-calibration-coverage] failed');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.message}`);
  }
  process.exit(1);
}

console.log(`[audit:hero-tool-calibration-coverage] ok (${heroTools.length} visible hero tools checked)`);
