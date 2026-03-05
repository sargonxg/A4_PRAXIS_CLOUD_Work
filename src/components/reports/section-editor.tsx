"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  Eye,
  Pencil,
  Loader2,
  CircleDot,
  CheckCircle2,
  FileEdit,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import type { ReportSection } from "@/stores/report-store";

/* -------------------------------------------------------------------------- */
/*  Pre-written demo content for AI generation                                */
/* -------------------------------------------------------------------------- */

const DEMO_CONTENT: Record<string, string> = {
  "executive-summary": `The ongoing crisis in Nordalia has entered a critical phase following the breakdown of ceasefire negotiations on 15 February 2026. The escalation of hostilities along the eastern border corridor has displaced an estimated 47,000 civilians, with UNHCR reporting a 340% increase in cross-border movements into neighboring Vestralia over the past three weeks.

The diplomatic landscape remains fragile. While the Nordalian government has signaled willingness to return to the negotiating table, opposition forces under General Kaverin continue to reject preconditions set by the mediating body. Regional stakeholders, particularly the Meridian Alliance, have adopted an increasingly assertive posture, complicating multilateral engagement efforts.

This report recommends an immediate three-track approach: (1) resumption of backchannel communications through the Special Envoy's office, (2) deployment of additional humanitarian monitoring teams to the Ostrava corridor, and (3) coordinated diplomatic pressure through the Security Council to establish a humanitarian access framework. Time-sensitive action is required to prevent further deterioration of the security situation.`,

  "situation-overview": `**Political Developments:** The Nordalian Parliament's emergency session on 12 February produced no consensus on the proposed ceasefire framework. The ruling coalition faces internal divisions, with the Progressive Democratic Front breaking ranks to demand direct negotiations with opposition forces. President Volkov's approval rating has dropped to 31%, the lowest since the crisis began, weakening the executive's mandate for concessions.

**Security Situation:** Armed clashes have intensified in the eastern provinces of Ostrava and Krennik, with confirmed reports of heavy artillery deployment near civilian population centers. The UN Mission in Nordalia (UNMIN) documented 127 ceasefire violations in the reporting period, representing a 78% increase from the previous month. Two UNMIN observation posts were damaged in crossfire on 18 February, prompting a temporary withdrawal of international monitoring personnel.

**Humanitarian Impact:** The humanitarian situation continues to deteriorate. The World Food Programme reports that food supplies in besieged areas of eastern Ostrava are critically low, with less than two weeks of reserves remaining for approximately 23,000 trapped civilians. Medical facilities in the region are operating at 15% capacity due to supply shortages and staff evacuations. UNICEF has flagged the forced recruitment of minors by non-state armed groups as an emerging concern.

**Regional Dynamics:** Neighboring states have adopted divergent positions on the crisis. Vestralia has strengthened border security while maintaining a humanitarian corridor at the Brennan crossing point. The Meridian Alliance convened an emergency summit on 20 February, issuing a communique that stopped short of calling for sanctions but signaled readiness to "consider all options" if humanitarian access is not restored within 30 days.`,

  "key-developments": `- **12 Feb 2026:** Nordalian Parliament emergency session fails to ratify ceasefire framework; Progressive Democratic Front breaks coalition unity.
- **14 Feb 2026:** General Kaverin releases public statement rejecting pre-conditions, demands recognition of eastern autonomy zone as basis for talks.
- **15 Feb 2026:** Ceasefire deadline expires without renewal; sporadic shelling reported along the Ostrava-Krennik line.
- **16 Feb 2026:** UNHCR declares Level 2 emergency for the Nordalia displacement crisis; activates regional response plan.
- **18 Feb 2026:** Two UNMIN observation posts damaged; Secretary-General issues statement condemning attacks on UN personnel.
- **20 Feb 2026:** Meridian Alliance emergency summit issues 30-day ultimatum on humanitarian access.
- **22 Feb 2026:** Special Envoy Nakamura initiates backchannel contacts with both parties; preliminary positive signals from government side.
- **25 Feb 2026:** WFP emergency airlift authorized for eastern Ostrava; access negotiations ongoing with armed groups controlling ground routes.`,

  "stakeholder-analysis": `**Nordalian Government (President Volkov):** Faces dual pressure from domestic hardliners demanding military solution and international community pushing for negotiated settlement. Weakened political position limits room for concessions. Primary interest: maintaining territorial integrity while preserving political survival.

**Opposition Forces (General Kaverin):** Cohesive military command but fragmented political agenda. Recent gains have strengthened maximalist positions within leadership. Dependent on external support from undisclosed state actors. Primary interest: recognition of eastern autonomy and amnesty guarantees.

**Meridian Alliance:** Regional bloc with significant economic leverage. Internal divisions between hawkish and moderate members complicate unified response. Primary interest: regional stability and containment of refugee flows.

**Special Envoy Nakamura:** Retains credibility with both parties but faces credibility erosion after failed February negotiations. Has requested expanded mandate from the Secretary-General. Primary interest: achieving durable ceasefire as foundation for comprehensive peace process.`,

  "risk-assessment": `**Critical Risk - Humanitarian catastrophe in eastern Ostrava:** Probability HIGH. The siege of civilian areas combined with dwindling supplies creates conditions for mass casualty events within 2-3 weeks without intervention.

**High Risk - Escalation to regional conflict:** Probability MEDIUM-HIGH. Meridian Alliance 30-day ultimatum introduces artificial deadline pressure. Military posturing along Vestralian border increases risk of miscalculation.

**High Risk - Collapse of diplomatic framework:** Probability MEDIUM. Both parties have reduced engagement with formal mediation channels. Without backchannel progress within the next 10 days, the political space for negotiation may close entirely.

**Moderate Risk - Targeted attacks on international personnel:** Probability MEDIUM. Damage to UNMIN posts may represent deliberate testing of international community's resolve rather than accidental crossfire.`,

  recommendations: `1. **Immediate (0-7 days):** Resume backchannel communications through Special Envoy Nakamura's office, focusing on humanitarian access as a confidence-building measure separate from political negotiations.

2. **Short-term (1-4 weeks):** Deploy additional humanitarian monitoring teams to the Ostrava corridor under the protection framework established by UNSC Resolution 2847. Coordinate with WFP on expanded airlift operations.

3. **Medium-term (1-3 months):** Establish a Contact Group comprising key regional stakeholders to develop a comprehensive ceasefire monitoring mechanism. Engage Meridian Alliance members bilaterally to build consensus for a graduated diplomatic response.

4. **Ongoing:** Strengthen early warning systems in border regions. Commission independent investigation into attacks on UNMIN observation posts. Maintain regular Security Council briefings to sustain international attention and diplomatic momentum.`,

  // Fallback for other section types
  purpose: `This briefing note is prepared for the attention of the Under-Secretary-General for Political and Peacebuilding Affairs regarding the rapidly evolving situation in Nordalia. It provides an updated assessment of the security, political, and humanitarian dimensions of the crisis and presents options for immediate diplomatic engagement.`,

  background: `The Nordalia crisis has its roots in long-standing tensions between the central government and eastern provinces over questions of autonomy, resource distribution, and political representation. Following disputed local elections in September 2025, armed opposition groups consolidated control over portions of Ostrava and Krennik provinces, precipitating a security response from government forces that escalated into sustained armed conflict by November 2025.

International mediation efforts, led by Special Envoy Nakamura since December 2025, achieved a temporary ceasefire in January 2026. However, disagreements over preconditions for formal negotiations prevented the ceasefire from being extended beyond its initial 30-day period.`,

  "current-situation": `As of late February 2026, the security situation in eastern Nordalia has deteriorated significantly. The expired ceasefire has given way to renewed hostilities, with both parties escalating military operations. The humanitarian toll continues to mount, with displacement figures approaching 50,000 and critical shortages reported in besieged areas.

Diplomatic channels remain open but strained. The Special Envoy's office maintains contact with both parties, and backchannel discussions have yielded some preliminary positive signals regarding a framework for humanitarian access negotiations.`,

  "options-analysis": `**Option A: Enhanced Mediation** - Expand the Special Envoy's mandate and resources to include parallel humanitarian and political negotiation tracks. Risk: May be perceived as rewarding intransigence if not accompanied by credible pressure.

**Option B: Security Council Action** - Pursue a new UNSC resolution establishing a humanitarian access framework with compliance monitoring. Risk: Potential veto by Council members with competing interests.

**Option C: Regional Engagement** - Work through the Meridian Alliance framework to develop a regional consensus approach. Risk: Alliance internal divisions may produce lowest-common-denominator outcomes.`,

  // Generic fallbacks
  "conflict-profile": `The Nordalia conflict represents a complex intra-state crisis with significant regional dimensions. Geographically concentrated in the eastern provinces of Ostrava and Krennik, the conflict has affected approximately 2.3 million people across a territory spanning 47,000 square kilometers. Since the onset of armed hostilities in November 2025, an estimated 1,200 conflict-related fatalities have been documented, along with 47,000 internally displaced persons.`,

  "root-causes": `The structural underpinnings of the Nordalia crisis encompass several interrelated factors: (1) Historical marginalization of eastern provinces in national governance structures, dating to the post-independence constitutional settlement of 1994; (2) Asymmetric economic development, with eastern regions receiving disproportionately low shares of natural resource revenues despite hosting 60% of the country's mineral extraction operations; (3) Identity-based grievances stemming from inadequate cultural and linguistic recognition of eastern communities.`,

  "conflict-dynamics": `The conflict exhibits a pattern of cyclical escalation driven by security dilemma dynamics. Government security operations, framed as counter-terrorism measures, have generated civilian casualties that strengthen support for armed opposition groups. This feedback loop is amplified by information warfare campaigns conducted by both sides through social media platforms and aligned media outlets.`,

  "actor-mapping": `Key actors in the Nordalia conflict can be categorized across three tiers: (1) Primary parties - the Nordalian Government under President Volkov and opposition forces under General Kaverin; (2) Regional stakeholders - the Meridian Alliance, Vestralia, and neighboring states with strategic interests; (3) International actors - the United Nations system, Special Envoy Nakamura, and bilateral partners with influence over the parties.`,

  scenarios: `**Best Case (20% probability):** Backchannel negotiations succeed in establishing a humanitarian access framework that serves as a foundation for renewed ceasefire talks. Regional pressure and internal political dynamics create conditions for a negotiated settlement within 6 months.

**Middle Case (50% probability):** Prolonged stalemate with periodic escalation. Neither party achieves decisive military advantage. Humanitarian situation remains critical but is partially mitigated through international access arrangements. Formal peace process delayed until 2027.

**Worst Case (30% probability):** Escalation spiral leading to full-scale military operations in eastern provinces. Regional intervention by Meridian Alliance members. Mass displacement exceeding 200,000. Collapse of diplomatic framework requiring fundamental reset of international engagement.`,

  "peacebuilding-entry": `Several entry points for peacebuilding engagement have been identified: (1) Local-level ceasefire agreements in specific geographic areas, building on existing informal arrangements; (2) Civil society dialogue platforms connecting moderate voices across the conflict divide; (3) Economic cooperation frameworks around shared infrastructure and resource management; (4) Truth and reconciliation mechanisms addressing historical grievances as a complement to political negotiations.`,

  "alert-summary": `ELEVATED THREAT LEVEL: Intelligence indicators suggest a potential escalation of military operations in the Ostrava corridor within the next 72-96 hours. Multiple sources report troop movements and logistics preparations consistent with a large-scale offensive operation.`,

  indicators: `- Satellite imagery confirms repositioning of heavy armor units to forward staging areas near the Ostrava-Krennik boundary
- Communications intercepts indicate heightened command-level activity across opposition force networks
- Civilian evacuation orders issued in three eastern municipalities by local authorities
- Suspension of humanitarian convoy movements by opposition forces citing "security considerations"
- Social media monitoring detects coordinated information operations preparing public narratives for military action`,

  context: `This alert follows the expiration of the 30-day Meridian Alliance ultimatum on humanitarian access. Both parties have engaged in military posturing during the diplomatic standoff, but current indicators suggest a qualitative shift from posturing to operational preparation.`,

  "immediate-actions": `1. Issue urgent diplomatic demarches to both parties emphasizing consequences of offensive operations
2. Activate emergency evacuation protocols for international personnel in the Ostrava corridor
3. Pre-position humanitarian supplies at Vestralian border crossing points
4. Request emergency Security Council consultation under Article 99
5. Deploy additional satellite monitoring assets to provide real-time situational awareness`,

  "mission-overview": `Field mission conducted from 10-17 February 2026, covering the western Ostrava region and the Brennan border crossing area. The mission team comprised three DPPA political affairs officers, two OCHA humanitarian coordinators, and one UNDSS security advisor. Meetings were held with local government officials, civil society representatives, displaced communities, and humanitarian implementing partners.`,

  findings: `The mission confirmed significant deterioration in living conditions in areas adjacent to active conflict zones. Key findings include: (1) Displacement is occurring in waves, with newer arrivals reporting more acute trauma and fewer resources; (2) Local governance structures remain functional in government-controlled areas but face severe resource constraints; (3) Community-level dialogue initiatives show resilience despite the broader conflict; (4) Access restrictions imposed by armed groups are the primary barrier to humanitarian response.`,

  "meetings-consultations": `- **Governor Petrovic (Ostrava Province):** Emphasized commitment to civilian protection but requested international support for security sector capacity. Expressed frustration with perceived lack of international pressure on opposition forces.
- **Civil Society Coalition:** Presented community peace initiative involving 12 local organizations. Requested funding and political support for grassroots dialogue processes.
- **WFP/UNICEF Field Teams:** Briefed on operational challenges including fuel shortages, access denials, and staff security concerns. Highlighted critical gap in child protection programming.`,

  observations: `Direct observation of conditions at the Brennan border crossing revealed efficient processing of refugees by Vestralian authorities, with average crossing times of 2-3 hours. However, overcrowding at the adjacent transit camp, which is hosting 8,000 people against a designed capacity of 3,000, raises serious concerns about sanitation and disease outbreak risk.`,

  "issue-statement": `The current diplomatic framework for the Nordalia crisis lacks adequate mechanisms for ensuring humanitarian access during active hostilities. This policy gap has resulted in a critical protection deficit for an estimated 23,000 civilians in besieged areas of eastern Ostrava.`,

  "evidence-base": `Analysis of 14 comparable conflict situations over the past decade demonstrates that early establishment of humanitarian access frameworks significantly reduces civilian mortality rates (by an average of 42%) and creates conditions more conducive to subsequent political negotiations. The evidence strongly supports a "humanitarian first" approach to the Nordalia crisis.`,

  "policy-options": `Three policy approaches have been evaluated: (1) Integrated negotiation linking humanitarian access to political settlement - slower but more comprehensive; (2) Parallel tracks maintaining separate humanitarian and political negotiation processes - more agile but risks creating leverage asymmetries; (3) Humanitarian-first sequencing establishing access framework before political talks - faster humanitarian results but may reduce incentives for political engagement.`,

  "recommended-policy": `The parallel track approach (Option 2) is recommended as the most viable policy framework. This approach maintains the urgency of humanitarian access negotiations while preserving the Special Envoy's ability to advance political dialogue. Key implementation considerations include establishing clear firewalls between the two tracks and ensuring adequate staffing for simultaneous negotiation processes.`,

  implementation: `**Phase 1 (Weeks 1-2):** Secure Security Council endorsement of parallel track framework. Appoint dedicated humanitarian negotiator. Establish communication protocols between tracks.

**Phase 2 (Weeks 3-6):** Launch humanitarian access negotiations with parties. Develop compliance monitoring mechanism. Coordinate with humanitarian agencies on operational readiness.

**Phase 3 (Weeks 7-12):** Implement humanitarian access framework. Begin political confidence-building measures. Establish review mechanism for parallel track coordination.`,
};

function getDemoContent(sectionId: string): string {
  return (
    DEMO_CONTENT[sectionId] ||
    `This section provides a detailed analysis of the relevant factors and considerations pertaining to the ${sectionId.replace(/-/g, " ")}. The assessment is based on available intelligence reports, field observations, and consultations with key stakeholders conducted during the reporting period.\n\nFurther analysis and regular updates will be provided as the situation evolves and additional information becomes available through established monitoring channels.`
  );
}

/* -------------------------------------------------------------------------- */
/*  Status icon helper                                                        */
/* -------------------------------------------------------------------------- */

const STATUS_META: Record<
  ReportSection["status"],
  { icon: React.ElementType; color: string; label: string }
> = {
  empty: { icon: Circle, color: "text-navy-500", label: "Empty" },
  generating: { icon: Loader2, color: "text-gold-400", label: "Generating" },
  draft: { icon: FileEdit, color: "text-teal", label: "Draft" },
  final: { icon: CheckCircle2, color: "text-sage", label: "Final" },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface SectionEditorProps {
  section: ReportSection;
  onUpdateContent: (content: string) => void;
  onUpdateStatus: (status: ReportSection["status"]) => void;
}

export function SectionEditor({
  section,
  onUpdateContent,
  onUpdateStatus,
}: SectionEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingContent, setPendingContent] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (isStreaming) return;

    setIsStreaming(true);
    setStreamedContent("");
    setPendingContent(null);
    onUpdateStatus("generating");

    try {
      const response = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: section.id,
          template: section.title,
          tone: "formal",
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const rawText = decoder.decode(value, { stream: true });
        // Parse AI SDK data stream format: lines starting with "0:" contain text chunks
        const lines = rawText.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const chunk = JSON.parse(line.slice(2));
              accumulated += chunk;
              setStreamedContent(accumulated);
            } catch {
              // skip malformed lines
            }
          }
        }
      }

      setPendingContent(accumulated || getDemoContent(section.id));
    } catch (err) {
      console.error("Section generation failed:", err);
      // Fallback to demo content
      const fallback = getDemoContent(section.id);
      setPendingContent(fallback);
      setStreamedContent(fallback);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, section.id, section.title, onUpdateStatus]);

  const handleAccept = useCallback(() => {
    if (pendingContent) {
      onUpdateContent(pendingContent);
      onUpdateStatus("draft");
      setPendingContent(null);
      setStreamedContent("");
    }
  }, [pendingContent, onUpdateContent, onUpdateStatus]);

  const handleReject = useCallback(() => {
    setPendingContent(null);
    setStreamedContent("");
    onUpdateStatus(section.content ? "draft" : "empty");
  }, [section.content, onUpdateStatus]);

  const wordCount = (section.content || streamedContent)
    .split(/\s+/)
    .filter(Boolean).length;

  const statusMeta = STATUS_META[section.status];
  const StatusIcon = statusMeta.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-navy-700 px-5 py-3">
        <div className="flex items-center gap-3">
          <StatusIcon
            className={cn(
              "h-4 w-4",
              statusMeta.color,
              section.status === "generating" && "animate-spin"
            )}
          />
          <div>
            <h3 className="text-sm font-semibold text-navy-50">
              {section.title}
            </h3>
            <p className="text-xs text-navy-500">{section.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className={cn(isPreview && "text-gold-400")}
          >
            {isPreview ? (
              <Pencil className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            <span className="text-xs ml-1">
              {isPreview ? "Edit" : "Preview"}
            </span>
          </Button>

          {/* Generate with AI */}
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isStreaming}
            className="gap-1.5"
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">
              {isStreaming ? "Generating..." : "Generate with AI"}
            </span>
          </Button>
        </div>
      </div>

      {/* Editor / Preview area */}
      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          {/* Streaming AI content */}
          {(isStreaming || pendingContent) && (
            <motion.div
              key="streaming"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4"
            >
              <div className="rounded-lg border border-gold-500/20 bg-gold-500/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-xs text-gold-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI-Generated Content</span>
                  {isStreaming && (
                    <span className="ml-auto flex items-center gap-1 text-navy-400">
                      <CircleDot className="h-3 w-3 animate-pulse text-gold-400" />
                      Writing...
                    </span>
                  )}
                </div>
                <MarkdownRenderer
                  content={streamedContent}
                  className="text-sm"
                />
              </div>

              {/* Accept / Reject buttons */}
              {pendingContent && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center gap-2"
                >
                  <Button size="sm" onClick={handleAccept} className="gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReject}
                    className="gap-1.5 text-navy-400"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Normal editor / preview */}
        {isPreview ? (
          <MarkdownRenderer
            content={section.content || "_No content yet._"}
          />
        ) : (
          <Textarea
            value={section.content}
            onChange={(e) => {
              onUpdateContent(e.target.value);
              if (section.status === "empty" && e.target.value.trim()) {
                onUpdateStatus("draft");
              }
            }}
            placeholder={`Start writing ${section.title.toLowerCase()} content here, or click "Generate with AI" to auto-draft this section...`}
            className="min-h-[300px] resize-none border-none bg-transparent text-sm leading-relaxed text-navy-200 placeholder:text-navy-600 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          />
        )}
      </div>

      {/* Word count footer */}
      <div className="flex items-center justify-between border-t border-navy-700 px-5 py-2">
        <span className="text-xs text-navy-500">
          {wordCount} word{wordCount !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              section.status === "empty" && "bg-navy-600",
              section.status === "generating" && "bg-gold-400 animate-pulse",
              section.status === "draft" && "bg-teal",
              section.status === "final" && "bg-sage"
            )}
          />
          <span className="text-xs text-navy-500 capitalize">
            {statusMeta.label}
          </span>
        </div>
      </div>
    </div>
  );
}
