'use client';

import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <textarea
      aria-label="Loading Monaco JSON editor"
      className="h-[520px] w-full resize-none border border-[#d8d1c5] bg-[#1f2522] p-4 font-mono text-sm text-[#f4f1ea]"
      readOnly
      value="Loading advanced JSON editor..."
    />
  ),
});

type CapsuleJsonMonacoEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CapsuleJsonMonacoEditor({ value, onChange }: CapsuleJsonMonacoEditorProps) {
  return (
    <div className="overflow-hidden border border-[#d8d1c5] bg-[#1f2522]">
      <MonacoEditor
        height="520px"
        language="json"
        theme="vs-dark"
        value={value}
        onChange={(next) => onChange(next ?? '')}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
