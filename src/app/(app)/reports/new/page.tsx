"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { REPORT_TEMPLATES } from "@/lib/constants/templates";
import type { ReportTemplate } from "@/lib/constants/templates";
import { TemplateSelector } from "@/components/reports/template-selector";
import { ReportComposer } from "@/components/reports/report-composer";

export default function NewReportPage() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);

  return (
    <div className="-mx-6 -my-6 h-[calc(100vh-4rem)]">
      <AnimatePresence mode="wait">
        {!selectedTemplate ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="h-full overflow-y-auto"
          >
            <TemplateSelector
              templates={REPORT_TEMPLATES}
              onSelect={setSelectedTemplate}
            />
          </motion.div>
        ) : (
          <motion.div
            key="composer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ReportComposer
              template={selectedTemplate}
              onBack={() => setSelectedTemplate(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
