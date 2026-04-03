import type { ResumeDetailRecord } from '@/lib/api';

export interface SelectedResumeSnapshot {
  id: string;
  title: string;
  detail: ResumeDetailRecord | null;
  rawResumeJson: unknown;
  updatedAt: number;
}

let selectedResumeSnapshot: SelectedResumeSnapshot | null = null;

export const getSelectedResumeSnapshot = (): SelectedResumeSnapshot | null => {
  return selectedResumeSnapshot;
};

export const setSelectedResumeSnapshot = (snapshot: {
  id: string;
  title?: string | null;
  detail: ResumeDetailRecord | null;
  rawResumeJson?: unknown;
}): SelectedResumeSnapshot => {
  const normalizedTitle = snapshot.title?.trim() || 'Untitled resume';

  selectedResumeSnapshot = {
    id: snapshot.id,
    title: normalizedTitle,
    detail: snapshot.detail,
    rawResumeJson: snapshot.rawResumeJson ?? null,
    updatedAt: Date.now(),
  };

  return selectedResumeSnapshot;
};

export const clearSelectedResumeSnapshot = (): void => {
  selectedResumeSnapshot = null;
};

export const getSelectedResumeRawJson = (): unknown => {
  return selectedResumeSnapshot?.rawResumeJson ?? null;
};
