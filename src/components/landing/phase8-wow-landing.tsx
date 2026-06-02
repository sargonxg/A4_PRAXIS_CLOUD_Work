"use client";

import { TaskletPraxisWorkbench } from "@/components/praxis/tasklet-praxis-workbench";

export function Phase8WowLanding() {
  return (
    <div className="praxis-public-workbench-shell praxis-enter relative min-h-screen overflow-hidden text-slate-900" data-testid="app-first-root">
      <TaskletPraxisWorkbench
        mode="public"
        activeCapsuleName="Middle East policy analysis"
      />
    </div>
  );
}
