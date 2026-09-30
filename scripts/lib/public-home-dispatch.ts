/** Static companion to app-page behavior tests: keep Drafts scoped and Home simple. */
export function auditAppHomeDispatch(source: string): string[] {
  if (!source.includes('TaskletPraxisWorkbench')) return [];
  const failures: string[] = [];
  if (!/const\s+memoId\s*=\s*singleResourceId\(query\.memoId\);/.test(source)) {
    failures.push('saved memo dispatch must validate memoId before opening the workbench');
  }
  const draftDispatch = /if\s*\(memoId\s*\|\|\s*query\.panel\s*===\s*'memo'\)\s*\{\s*return\s+<TaskletPraxisWorkbench\b[^>]*\binitialMemoId=\{memoId\}[^>]*\binitialPanel="ask"[^>]*\/>;\s*\}/;
  if (!draftDispatch.test(source)) {
    failures.push('workbench dispatch must require a validated memoId or the explicit Drafts panel');
  }
  const homeReturnIndex = source.indexOf('return (');
  const ordinaryHome = homeReturnIndex < 0 ? '' : source.slice(homeReturnIndex);
  if (!/<PraxisChatFirstShell\b[^>]*\bmode="authenticated"[^>]*\/>/.test(ordinaryHome) || ordinaryHome.includes('TaskletPraxisWorkbench')) {
    failures.push('ordinary signed-in Home must retain the direct Ask shell');
  }
  if ((source.match(/<TaskletPraxisWorkbench\b/g) ?? []).length !== 1) {
    failures.push('memo and Drafts dispatch must be the only workbench render in the app index');
  }
  return failures;
}
