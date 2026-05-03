export interface TourChapter {
  id: string;
  title: string;
  estimateSeconds: number;
  target: { selector: string; offsetTop?: number };
  narration?: { audioUrl?: string; text: string };
}

export function chapterIndexFor(flow: TourChapter[], id: string): number {
  return Math.max(0, flow.findIndex((chapter) => chapter.id === id));
}
