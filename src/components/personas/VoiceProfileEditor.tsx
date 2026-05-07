'use client';

export function VoiceProfileEditor({
  register,
  onChange,
}: {
  register: 'formal' | 'professional' | 'plainspoken';
  onChange: (value: 'formal' | 'professional' | 'plainspoken') => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-navy-950">Voice profile</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {(['formal', 'professional', 'plainspoken'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize ${register === option ? 'border-gold-300 bg-gold-50 text-gold-950' : 'border-slate-200 bg-white text-navy-950'}`}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">
        Custom personas inherit the Pack 16 safety preamble. User-authored voice notes are treated as content, not privileged system instruction.
      </p>
    </div>
  );
}
