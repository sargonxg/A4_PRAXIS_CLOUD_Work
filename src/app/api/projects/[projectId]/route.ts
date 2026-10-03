import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getProject, mutateProject } from '@/lib/projects/service';
import { projectBody, projectRouteError } from '@/lib/projects/http';

type Context = { params: Promise<{ projectId: string }> };
export const GET = withAuth<Context>(async (_request, user, context) => {
  if (user.isDemo) return NextResponse.json({ error: 'Project unavailable.' }, { status: 404 });
  try {
    const project = await getProject(user.uid, (await context.params).projectId);
    return project ? NextResponse.json({ project }) : NextResponse.json({ error: 'Project unavailable.' }, { status: 404 });
  } catch (error) { return projectRouteError(error); }
});
export const PATCH = withAuth<Context>(async (request, user, context) => {
  if (user.isDemo) return NextResponse.json({ error: 'Sign in to save work.' }, { status: 403 });
  try {
    const projectId = (await context.params).projectId;
    await mutateProject(user.uid, projectId, await projectBody(request));
    const project = await getProject(user.uid, projectId);
    if (!project) return NextResponse.json({ error: 'Project unavailable.' }, { status: 404 });
    return NextResponse.json({ project, persisted: true });
  }
  catch (error) { return projectRouteError(error); }
});
