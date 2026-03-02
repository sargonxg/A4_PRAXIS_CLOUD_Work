import { create } from "zustand";

export interface ReportSection {
  id: string;
  title: string;
  description: string;
  content: string;
  status: "empty" | "generating" | "draft" | "final";
}

export interface Report {
  id: string;
  title: string;
  templateId: string;
  templateName: string;
  sections: ReportSection[];
  status: "draft" | "review" | "final";
  createdAt: string;
  updatedAt: string;
}

interface ReportState {
  report: Report | null;
  activeSection: string | null;
  isGenerating: boolean;
  setReport: (report: Report) => void;
  setActiveSection: (id: string | null) => void;
  updateSection: (id: string, content: string) => void;
  setSectionStatus: (id: string, status: ReportSection["status"]) => void;
  setGenerating: (v: boolean) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  report: null,
  activeSection: null,
  isGenerating: false,
  setReport: (report) => set({ report }),
  setActiveSection: (id) => set({ activeSection: id }),
  updateSection: (id, content) =>
    set((state) => {
      if (!state.report) return state;
      return {
        report: {
          ...state.report,
          updatedAt: new Date().toISOString(),
          sections: state.report.sections.map((s) =>
            s.id === id ? { ...s, content } : s
          ),
        },
      };
    }),
  setSectionStatus: (id, status) =>
    set((state) => {
      if (!state.report) return state;
      return {
        report: {
          ...state.report,
          sections: state.report.sections.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        },
      };
    }),
  setGenerating: (v) => set({ isGenerating: v }),
}));
