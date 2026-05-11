# PRAXIS High-Wow Visibility Queue

Date: 2026-05-11

This queue tracks the next visible improvements after the deployed Rust
Semantica checkpoint. The priority is to make PRAXIS feel like a simple,
powerful policy workbench while preserving honest evidence posture.

## Shipped This Pass

1. Add a dashboard Repository Spine that visibly connects User Core, Context
   Core, graph and sources, tools, and memo output.
2. Show the live Rust Semantica substrate from `/api/health/semantica-core`
   inside the authenticated dashboard.
3. Let the user attach repository layers into Ask PRAXIS with one action, so
   questions carry core context, research posture, tool selection, and memo
   intent.

## High-Impact Queue

1. **Context Core Inspector**
   Build a dedicated inspector panel for every situation: semantic graph
   readiness, missing nodes, orphan edges, source gaps, ontology coverage, and
   memo readiness.

2. **Memo Quality Console**
   Add a drafting console that shows thesis, options, evidence coverage,
   assumptions, citations, red-team objections, and export readiness before the
   memo is generated.

3. **Research Intake Lane**
   Create a single visual lane for Wikidata, grounded Google Search, deep
   search agents, documents, and manual notes. Every intake item should attach
   to the Context Core as evidence, actor, event, claim, or open question.

4. **Postgres Promotion Worker**
   Promote Firestore Semantica graph seeds into Postgres automatically. Mark
   each graph document as pending, promoted, failed, or superseded with
   timestamps and failure reasons.

5. **Rust Enrichment Layer**
   Move more graph validation and enrichment into Rust: duplicate detection,
   orphan repair suggestions, ontology bucket assignment, source confidence
   scoring, and fast memo-readiness checks.

6. **Ask PRAXIS Tool Planner**
   Before running tools, Ask PRAXIS should display a short plan: selected
   cores, chosen tools, reason for order, expected outputs, cost/risk posture,
   and confirmation button.

7. **Live Core Attachments Everywhere**
   Put the same User Core and Context Core attachment strip on workbench,
   memo, tools, and context pages. The user should always see what PRAXIS is
   reasoning from.

8. **Workbench Demo Narrative**
   Add a beautiful Syria/demo workbench path that shows a strong end-to-end
   story: create context, enrich research, inspect graph, ask PRAXIS, draft
   memo, export.

9. **Production Smoke Harness**
   Add one command that checks deployed health, Rust health, login redirect,
   dashboard render, context core route, tool route, and unauthenticated API
   guardrails.

10. **Repository Cleanup Pass**
    Continue deleting or archiving duplicate surfaces that compete with the
    canonical routes: `/app/dashboard`, `/app/cores/context`,
    `/app/cores/user`, `/app/tools`, `/app/workbench`, and `/app/situations/new`.

