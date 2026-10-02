import { z } from 'zod';

export const ProjectIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,120}$/);
const text = (max: number) => z.string().trim().max(max);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Use a valid calendar date');
export const ProjectScopeSchema = z.object({
  title: text(200).min(1), question: text(2000).min(1), purpose: text(2000),
  audience: text(500), jurisdiction: text(500), asOfDate: date.nullable(),
  language: text(80).min(1), mandate: text(3000), conventions: text(3000),
}).strict();
const operationId = z.string().regex(/^[a-zA-Z0-9_-]{8,100}$/);
const command = { expectedRevision: z.number().int().positive(), operationId };
export const CreateProjectSchema = z.object({ scope: ProjectScopeSchema, operationId }).strict();
export const ProjectMutationSchema = z.discriminatedUnion('action', [
  z.object({ ...command, action: z.literal('scope'), scope: ProjectScopeSchema }).strict(),
  z.object({ ...command, action: z.literal('attach'), capsuleId: ProjectIdSchema, version: z.number().int().positive(), role: z.enum(['user', 'situation', 'tool', 'output']) }).strict(),
  z.object({ ...command, action: z.literal('detach'), capsuleId: ProjectIdSchema }).strict(),
  z.object({ ...command, action: z.literal('add-work'), title: text(200).min(1), instruction: text(4000).min(1), output: z.enum(['brief', 'stakeholder-map', 'notes', 'scenario-comparison', 'talking-points']) }).strict(),
  z.object({ ...command, action: z.literal('cancel-work'), workItemId: ProjectIdSchema }).strict(),
]);
export type ProjectScope = z.infer<typeof ProjectScopeSchema>;
export type ProjectMutation = z.infer<typeof ProjectMutationSchema>;
export interface ProjectContextPin {
  capsuleId: string; version: number; role: 'user' | 'situation' | 'tool' | 'output';
  label: string; contentHash: string; documentIds: string[]; sourceIds: string[];
}
export interface ProjectWorkItem {
  workItemId: string; title: string; instruction: string; output: string;
  state: 'draft' | 'cancelled'; createdAt: string; updatedAt: string;
  projectRevision: number; scope: ProjectScope; context: ProjectContextPin[];
}
export interface ProjectRecord extends ProjectScope {
  schemaVersion: 1; projectId: string; ownerUid: string; workspaceId: string; access: 'private';
  revision: number; context: ProjectContextPin[]; workItems: ProjectWorkItem[];
  createdAt: string; updatedAt: string; createHash: string;
  history: { revision: number; actorUid: string; at: string; action: string }[];
  operations: { id: string; hash: string }[];
}
export interface ProjectView extends ProjectRecord {
  contextStatus: { capsuleId: string; status: 'available' | 'changed' | 'unavailable'; latestVersion: number | null }[];
}
export function projectScope(project: ProjectScope): ProjectScope {
  return ProjectScopeSchema.parse(Object.fromEntries(Object.keys(ProjectScopeSchema.shape).map((key) => [key, project[key as keyof ProjectScope]])));
}
