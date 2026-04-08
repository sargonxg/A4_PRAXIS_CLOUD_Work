'use client';

import { useState, useEffect } from 'react';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useSituationStore } from '@/stores/situation-store';
import { useAuth } from '@/lib/auth/auth-context';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Download, FileText, Loader2, Package } from 'lucide-react';

interface ToolOutput {
  toolName: string;
  displayName: string;
  generatedAt: string | null;
  hasData: boolean;
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  scenario_analysis: 'Scenario Analysis',
  dossier: 'Diplomatic Dossier',
  briefing: 'Intelligence Briefing',
  talking_points: 'Talking Points',
  risk_assessment: 'Risk Assessment',
  escalation_scan: 'Escalation Assessment',
  media_analysis: 'Media & Narrative Analysis',
  media_roundup: 'Media Roundup',
  sanctions_scan: 'Sanctions Compliance',
  treaty_analysis: 'Treaty Analysis',
  commitment_scan: 'Commitment Tracker',
  stakeholder_map: 'Stakeholder Map',
  early_warning: 'Early Warning Brief',
  info_environment: 'Information Environment',
  policy_memo: 'Policy Memorandum',
  game_theory: 'Game Theory Analysis',
  negotiation_prep: 'Negotiation Preparation',
  power_map: 'Power Map',
  actor_enrichment: 'Actor Enrichment',
  historical_parallels: 'Historical Parallels',
};

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadMarkdown(filename: string, toolName: string, data: Record<string, unknown>, situationName: string) {
  const lines = [
    `# ${TOOL_DISPLAY_NAMES[toolName] || toolName}`,
    `**Situation:** ${situationName}`,
    `**Generated:** ${data.generatedAt || new Date().toISOString()}`,
    '',
    '---',
    '',
  ];

  // Recursively extract text content from the data
  function extractLines(obj: unknown, depth = 0): void {
    if (typeof obj === 'string') {
      lines.push(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach((item) => extractLines(item, depth));
    } else if (obj && typeof obj === 'object') {
      for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
        if (key === 'generatedAt') continue;
        if (typeof val === 'string' || typeof val === 'number') {
          lines.push(`${'  '.repeat(depth)}**${key}:** ${val}`);
        } else {
          lines.push(`${'  '.repeat(depth)}### ${key}`);
          extractLines(val, depth + 1);
        }
      }
    }
  }

  extractLines(data);

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportCenterPage() {
  const { showGuard } = useSituationGuard();
  const situation = useSituationStore((s) => s.activeSituation);
  const { user } = useAuth();

  const [tools, setTools] = useState<ToolOutput[]>([]);
  const [toolData, setToolData] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(true);
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => {
    if (!user?.id || !situation?.id) { setLoading(false); return; }

    getDocs(collection(db, 'users', user.id, 'situations', situation.id, 'tools'))
      .then((snap) => {
        const data: Record<string, Record<string, unknown>> = {};
        const outputs: ToolOutput[] = [];

        snap.forEach((doc) => {
          const d = doc.data() as Record<string, unknown>;
          data[doc.id] = d;
          outputs.push({
            toolName: doc.id,
            displayName: TOOL_DISPLAY_NAMES[doc.id] || doc.id,
            generatedAt: d.generatedAt as string | null,
            hasData: true,
          });
        });

        setToolData(data);
        setTools(outputs.sort((a, b) => a.displayName.localeCompare(b.displayName)));
      })
      .finally(() => setLoading(false));
  }, [user?.id, situation?.id]);

  if (showGuard) return <NoSituationState />;

  async function exportAll() {
    setExportingAll(true);
    const bundle = {
      situation: { id: situation?.id, name: situation?.name },
      exportedAt: new Date().toISOString(),
      tools: toolData,
    };
    downloadJSON(`praxis-${situation?.name?.replace(/\s+/g, '-').toLowerCase()}-export.json`, bundle);
    setExportingAll(false);
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-diplomatic-blue" />
            Export Center
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            Download all AI-generated intelligence outputs for <strong>{situation?.name}</strong>.
          </p>
        </div>
        <button
          onClick={exportAll}
          disabled={exportingAll || tools.length === 0}
          className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
        >
          {exportingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export All (JSON)
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
        </div>
      ) : tools.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-navy-300 mb-3" />
          <p className="text-sm font-medium text-navy-700">No tool outputs yet</p>
          <p className="text-xs text-navy-400 mt-1">Generate intelligence using the tools in the sidebar, then return here to export.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white divide-y divide-[var(--color-app-border)]">
          {tools.map((tool) => (
            <div key={tool.toolName} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-navy-800">{tool.displayName}</p>
                {tool.generatedAt && (
                  <p className="text-[10px] text-navy-400">
                    Generated {new Date(tool.generatedAt).toLocaleDateString()} at {new Date(tool.generatedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadMarkdown(
                    `${tool.toolName}-${situation?.id}.md`,
                    tool.toolName,
                    toolData[tool.toolName] || {},
                    situation?.name || '',
                  )}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--color-app-border)] px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Markdown
                </button>
                <button
                  onClick={() => downloadJSON(
                    `${tool.toolName}-${situation?.id}.json`,
                    toolData[tool.toolName] || {},
                  )}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--color-app-border)] px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
