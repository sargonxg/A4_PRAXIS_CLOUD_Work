import { ShieldCheck } from 'lucide-react';
import { blockKey, type DraftAudience, type DraftBlockRedactions, type DraftMemoOption } from '@/lib/workbench/draft-assembly-state';

interface RedactionSettingsProps {
  audience: DraftAudience;
  selectedMemos: DraftMemoOption[];
  redactions: DraftBlockRedactions;
  onAudienceChange: (audience: DraftAudience) => void;
  onRedactionChange: (blockId: string, level: DraftAudience) => void;
}

const LEVELS: DraftAudience[] = ['public', 'internal', 'restricted'];

export function RedactionSettings({
  audience,
  selectedMemos,
  redactions,
  onAudienceChange,
  onRedactionChange,
}: RedactionSettingsProps) {
  const visibleBlocks = selectedMemos.flatMap((memo) =>
    memo.blocks.slice(0, 4).map((block) => ({
      memo,
      block,
      key: blockKey(memo.id, block.id),
    })),
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-gold-600" />
        <div>
          <h3 className="text-base font-semibold text-navy-950">Redaction Settings</h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Pick the export audience and mark sensitive blocks. Public exports withhold internal and restricted blocks; internal exports withhold restricted blocks.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
        <label>
          <span className="text-xs font-semibold text-navy-800">Export as</span>
          <select
            value={audience}
            onChange={(event) => onAudienceChange(event.target.value as DraftAudience)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-navy-950 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
          >
            {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </label>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          These settings are packaging controls. Hard firewall invariants still apply at write time; this surface only filters what leaves the briefing.
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {visibleBlocks.map(({ memo, block, key }) => (
          <div key={key} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-[1fr_160px]">
            <div>
              <p className="text-xs font-semibold text-navy-950">{memo.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-700">{block.title ?? block.content}</p>
            </div>
            <label>
              <span className="sr-only">Redaction level</span>
              <select
                value={redactions[key] ?? 'internal'}
                onChange={(event) => onRedactionChange(key, event.target.value as DraftAudience)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-950 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
              >
                {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
