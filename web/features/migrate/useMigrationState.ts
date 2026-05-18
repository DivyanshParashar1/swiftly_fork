'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ResumeDetailRecord } from '@/lib/api';
import type { MigrationSection, MigrationConfig, TemplateMeta, SECTION_LABELS } from './types';

// ─── Section key → item extraction helpers ────────────────────────────────────

function getSectionItems(resume: ResumeDetailRecord, sectionKey: string) {
  switch (sectionKey) {
    case 'education':
      return (resume.education || []).map((e) => ({
        id: e.id,
        label: e.instituteName || e.degree || 'Education entry',
        sublabel: e.startDate && e.endDate ? `${e.startDate} – ${e.endDate}` : '',
      }));
    case 'experience':
      return (resume.experience || []).map((e) => ({
        id: e.id,
        label: e.companyName || e.position || 'Experience entry',
        sublabel: e.position || '',
      }));
    case 'projects':
      return (resume.projects || []).map((p) => ({
        id: p.id,
        label: p.projectName || 'Project',
        sublabel: (p.techStack || []).slice(0, 3).join(', '),
      }));
    case 'skills':
      return (resume.skills || []).map((s) => ({
        id: s.id,
        label: s.name || 'Skill',
        sublabel: s.category || '',
      }));
    case 'achievements':
      return (resume.achievements || []).map((a) => ({
        id: a.id,
        label: a.title || 'Achievement',
        sublabel: a.org || a.date || '',
      }));
    case 'por':
      return (resume.pors || []).map((p) => ({
        id: p.id,
        label: p.title || 'POR',
        sublabel: p.org || '',
      }));
    case 'publications':
      return (resume.publications || []).map((p) => ({
        id: p.id,
        label: p.title || 'Publication',
        sublabel: p.conference || '',
      }));
    case 'summary':
      // Summary is a scalar — represent as single pseudo-item
      return resume.summary
        ? [{ id: 'summary-content', label: resume.summary.slice(0, 60) + '…', sublabel: '' }]
        : [];
    default:
      return [];
  }
}

// ─── useMigrationState ────────────────────────────────────────────────────────

export interface SectionItem {
  id: string;
  label: string;
  sublabel: string;
}

export interface SectionState extends MigrationSection {
  label: string;
  items: SectionItem[];
}

export interface MigrationState {
  sections: SectionState[];
  userInputs: Record<string, string>;
}

export function useMigrationState(
  resume: ResumeDetailRecord,
  meta: TemplateMeta
) {
  // Initialise sections from meta.defaultSectionOrder — only include sections that
  // have data in the resume (or are 'summary' with content).
  const initialSections = useMemo((): SectionState[] => {
    const SECTION_LABELS: Record<string, string> = {
      summary: 'Summary',
      education: 'Education',
      experience: 'Experience',
      projects: 'Projects',
      skills: 'Technical Skills',
      achievements: 'Achievements',
      por: 'Positions of Responsibility',
      publications: 'Publications',
    };

    return meta.defaultSectionOrder.map((key) => {
      const items = getSectionItems(resume, key);
      return {
        key,
        label: SECTION_LABELS[key] ?? key,
        visible: items.length > 0,  // only visible if data exists
        itemOrder: items.map((i) => i.id),
        hiddenItems: [],
        items,
      };
    });
  }, [resume, meta]);

  const [sections, setSections] = useState<SectionState[]>(initialSections);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});

  // ── Section ordering ──────────────────────────────────────────────────────

  const reorderSections = useCallback((newOrder: SectionState[]) => {
    setSections(newOrder);
  }, []);

  const toggleSectionVisibility = useCallback((key: string) => {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, visible: !s.visible } : s))
    );
  }, []);

  // ── Item visibility ───────────────────────────────────────────────────────

  const toggleItemVisibility = useCallback((sectionKey: string, itemId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.key !== sectionKey) return s;
        const isHidden = s.hiddenItems.includes(itemId);
        return {
          ...s,
          hiddenItems: isHidden
            ? s.hiddenItems.filter((id) => id !== itemId)
            : [...s.hiddenItems, itemId],
        };
      })
    );
  }, []);

  // ── User inputs ───────────────────────────────────────────────────────────

  const setUserInput = useCallback((key: string, value: string) => {
    setUserInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetToDefault = useCallback(() => {
    setSections(initialSections);
    setUserInputs({});
  }, [initialSections]);

  // ── Serialise to MigrationConfig ──────────────────────────────────────────

  const migrationConfig = useMemo((): MigrationConfig => ({
    sections: sections.map(({ key, visible, itemOrder, hiddenItems }) => ({
      key,
      visible,
      itemOrder,
      hiddenItems,
    })),
    userInputs,
  }), [sections, userInputs]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const visibleCount = sections.filter((s) => s.visible).length;

  return {
    sections,
    userInputs,
    migrationConfig,
    visibleCount,
    reorderSections,
    toggleSectionVisibility,
    toggleItemVisibility,
    setUserInput,
    resetToDefault,
  };
}
