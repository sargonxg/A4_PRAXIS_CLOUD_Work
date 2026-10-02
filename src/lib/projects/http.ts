import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DocumentOwnerUnavailableError } from '@/lib/documents/owner-write';
import { ProjectError } from './service';

export function projectRouteError(error: unknown): Response {
  if (error instanceof ZodError) return NextResponse.json({ error: 'Invalid project request. Check the required fields and dates.', code: 'invalid_project' }, { status: 400 });
  if (error instanceof ProjectError || error instanceof DocumentOwnerUnavailableError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  return NextResponse.json({ error: 'Project storage is unavailable. Keep your edits and retry.', code: 'project_storage_unavailable' }, { status: 503 });
}
export async function projectBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (Buffer.byteLength(text) > 30_000) throw new ProjectError(413, 'request_size', 'Project request is too large.');
  try { return JSON.parse(text); } catch { throw new ProjectError(400, 'invalid_json', 'Send a valid project request.'); }
}
