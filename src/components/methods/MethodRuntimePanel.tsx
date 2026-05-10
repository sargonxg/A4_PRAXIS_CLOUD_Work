'use client';

import { useState } from 'react';
import { MethodInputForm } from '@/components/methods/MethodInputForm';
import { MethodRunView } from '@/components/methods/MethodRunView';
import type { MethodDefinition } from '@/lib/methods/catalog';

interface PreviewPayload {
  contextId: string;
  prompt: string;
}

export function MethodRuntimePanel({ method }: { method: MethodDefinition }) {
  const [preview, setPreview] = useState<PreviewPayload | null>(null);

  return (
    <>
      <MethodInputForm method={method} onPreview={setPreview} />
      <MethodRunView method={method} preview={preview} />
    </>
  );
}
