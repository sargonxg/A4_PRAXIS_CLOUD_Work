import type { Metadata } from "next";
import { WaitlistPageClient } from "./waitlist-page-client";

export const metadata: Metadata = {
  title: "Join the Waitlist - PRAXIS by TACITUS",
  description:
    "Request early access to PRAXIS, the graph-grounded workbench for policy, conflict, mediation, and diplomacy professionals.",
};

export default function WaitlistPage() {
  return <WaitlistPageClient />;
}
