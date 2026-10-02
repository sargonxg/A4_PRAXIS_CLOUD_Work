import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { createProject, listProjects } from '@/lib/projects/service';
import { projectBody, projectRouteError } from '@/lib/projects/http';

export const GET = withAuth(async (_request, user) => {
  if (user.isDemo) return NextResponse.json({ projects: [] });
  try { return NextResponse.json({ projects: await listProjects(user.uid) }); }
  catch (error) { return projectRouteError(error); }
});
export const POST = withAuth(async (request, user) => {
  if (user.isDemo) return NextResponse.json({ error: 'Sign in to save a private project.' }, { status: 403 });
  try { return NextResponse.json({ project: await createProject(user.uid, await projectBody(request)), persisted: true }); }
  catch (error) { return projectRouteError(error); }
});
