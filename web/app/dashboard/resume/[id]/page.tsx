'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import {
  ApiError,
  resumeApi,
  updateApi,
  type ResumeDetailRecord,
  type EducationRecord,
  type ExperienceRecord,
  type ProjectRecord,
  type SkillRecord,
  type AchievementRecord,
  type PorRecord,
  type PublicationRecord,
} from '@/lib/api';
import { clearAuthUser } from '@/lib/authSession';

type TabKey =
  | 'overview'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'achievements'
  | 'pors'
  | 'publications';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'overview()' },
  { key: 'education', label: 'education[]' },
  { key: 'experience', label: 'experience[]' },
  { key: 'projects', label: 'projects[]' },
  { key: 'skills', label: 'skills[]' },
  { key: 'achievements', label: 'achievements[]' },
  { key: 'pors', label: 'pors[]' },
  { key: 'publications', label: 'publications[]' },
];

const EXP_TYPES = ['INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'RESEARCH', 'VOLUNTEER'];

type ResumeDetailApiData = ResumeDetailRecord | ResumeDetailRecord[] | null | undefined;

function normalizeResumeDetail(payload: ResumeDetailApiData): ResumeDetailRecord | null {
  const raw = Array.isArray(payload) ? payload[0] : payload;
  if (!raw) return null;

  return {
    ...raw,
    education: raw.education ?? [],
    experience: raw.experience ?? [],
    projects: raw.projects ?? [],
    skills: raw.skills ?? [],
    achievements: raw.achievements ?? [],
    pors: raw.pors ?? [],
    publications: raw.publications ?? [],
  };
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
      <p className="font-mono text-gray-500 text-sm">// no {label} found in this resume</p>
    </div>
  );
}

function DateRange({ start, end }: { start?: string | null; end?: string | null }) {
  if (!start && !end) return null;
  return (
    <span className="text-xs font-mono text-gray-500">
      {start || '?'} {end ? `→ ${end}` : '→ present'}
    </span>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-blue-500 text-sm';
const textareaClass = `${inputClass} min-h-24 resize-y`;
const labelClass = 'text-xs font-mono text-blue-600';

function EditableInput({
  label,
  value,
  onChange,
  placeholder,
  inputType = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputType?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className="space-y-1 block">
      <span className={labelClass}>{label}</span>
      <input type={inputType} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function EditableTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 block">
      <span className={labelClass}>{label}</span>
      <textarea className={textareaClass} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function cleanNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function cleanNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const numeric = Number(trimmed);
  return Number.isNaN(numeric) ? null : numeric;
}

export default function ResumeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.id as string;
  const { enqueueSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [resume, setResume] = useState<ResumeDetailRecord | null>(null);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const setDraftField = (field: string, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const beginEdit = (key: string, initial: object) => {
    const normalized: Record<string, string> = {};
    for (const [field, value] of Object.entries(initial as Record<string, unknown>)) {
      normalized[field] = value == null ? '' : String(value);
    }
    setEditingKey(key);
    setDraft(normalized);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft({});
  };

  const saveWith = async (fn: () => Promise<void>) => {
    setIsSaving(true);
    try {
      await fn();
      enqueueSnackbar('Updated successfully', { variant: 'success' });
      cancelEdit();
      await loadResume();
    } catch (error) {
      if (error instanceof ApiError) {
        enqueueSnackbar(error.message, { variant: 'error' });
      } else {
        enqueueSnackbar('Update failed', { variant: 'error' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const loadResume = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await resumeApi.fetchResumeById(resumeId);
      const normalized = normalizeResumeDetail(response.data as ResumeDetailApiData);
      if (!normalized) {
        enqueueSnackbar('Resume not found', { variant: 'error' });
        router.push('/dashboard');
        return;
      }
      setResume(normalized);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        enqueueSnackbar('Please sign in to continue', { variant: 'warning' });
        router.push('/signin');
        return;
      }
      if (error instanceof ApiError) {
        enqueueSnackbar(error.message, { variant: 'error' });
      } else {
        enqueueSnackbar('Failed to load resume', { variant: 'error' });
      }
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, enqueueSnackbar, router]);

  useEffect(() => {
    void loadResume();
  }, [loadResume]);

  const handleExportPdf = async () => {
    if (!resume) return;
    setIsExporting(true);
    try {
      const blob = await resumeApi.exportResumeToPdf(resume.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const filename = (resume.title || [resume.firstName, resume.lastName].filter(Boolean).join('_') || 'resume').replace(/\s+/g, '_');
      anchor.href = url;
      anchor.download = `${filename}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar('PDF downloaded successfully', { variant: 'success' });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        clearAuthUser();
        enqueueSnackbar('Session expired. Please sign in again.', { variant: 'warning' });
        router.push('/signin');
        return;
      }
      if (error instanceof ApiError) {
        enqueueSnackbar(error.message, { variant: 'error' });
      } else {
        enqueueSnackbar('PDF export failed. Make sure pdflatex is available on the server.', { variant: 'error' });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const tabCounts = useMemo(() => {
    if (!resume) return {} as Record<TabKey, number>;
    return {
      overview: 1,
      education: resume.education.length,
      experience: resume.experience.length,
      projects: resume.projects.length,
      skills: resume.skills.length,
      achievements: resume.achievements.length,
      pors: resume.pors.length,
      publications: resume.publications.length,
    };
  }, [resume]);

  const headingName = useMemo(() => {
    if (!resume) return '...';
    const n = [resume.firstName, resume.lastName].filter(Boolean).join(' ');
    return resume.title || n || 'Resume';
  }, [resume]);

  const renderOverview = () => {
    if (!resume) return null;
    const key = `resume:${resume.id}`;
    const isEditing = editingKey === key;

    if (!isEditing) {
      const fullName = [resume.firstName, resume.middleName, resume.lastName].filter(Boolean).join(' ');
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-5 space-y-4">
            <div className="flex justify-between items-center gap-2">
              <h3 className="font-mono text-sm text-gray-400">// resume</h3>
              <button
                type="button"
                onClick={() =>
                  beginEdit(key, {
                    title: resume.title,
                    firstName: resume.firstName,
                    middleName: resume.middleName,
                    lastName: resume.lastName,
                    country: resume.country,
                    phoneNumber: resume.phoneNumber,
                    resumeEmail: resume.resumeEmail,
                    linkedIn: resume.linkedIn,
                    github: resume.github,
                    personalPortfolio: resume.personalPortfolio,
                    leetCode: resume.leetCode,
                    codingProfile2: resume.codingProfile2,
                    codingProfile3: resume.codingProfile3,
                    summary: resume.summary,
                    dateOfBirth: resume.dateOfBirth,
                    address: resume.address,
                    yearOfGraduation: resume.yearOfGraduation,
                  })
                }
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-mono text-xs hover:border-blue-500 hover:text-blue-700 transition-colors"
              >
                edit()
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div><span className={labelClass}>fullName</span><p>{fullName || '-'}</p></div>
              <div><span className={labelClass}>title</span><p>{resume.title || '-'}</p></div>
              <div><span className={labelClass}>resumeEmail</span><p>{resume.resumeEmail || '-'}</p></div>
              <div><span className={labelClass}>phoneNumber</span><p>{resume.phoneNumber || '-'}</p></div>
              <div><span className={labelClass}>country</span><p>{resume.country || '-'}</p></div>
              <div><span className={labelClass}>dateOfBirth</span><p>{resume.dateOfBirth || '-'}</p></div>
              <div><span className={labelClass}>yearOfGraduation</span><p>{resume.yearOfGraduation ?? '-'}</p></div>
              <div><span className={labelClass}>linkedIn</span><p className="break-all">{resume.linkedIn || '-'}</p></div>
              <div><span className={labelClass}>github</span><p className="break-all">{resume.github || '-'}</p></div>
              <div><span className={labelClass}>personalPortfolio</span><p className="break-all">{resume.personalPortfolio || '-'}</p></div>
              <div><span className={labelClass}>leetCode</span><p>{resume.leetCode || '-'}</p></div>
              <div><span className={labelClass}>codingProfile2</span><p>{resume.codingProfile2 || '-'}</p></div>
              <div><span className={labelClass}>codingProfile3</span><p>{resume.codingProfile3 || '-'}</p></div>
              <div className="sm:col-span-2"><span className={labelClass}>address</span><p>{resume.address || '-'}</p></div>
            </div>

            <div>
              <span className={labelClass}>summary</span>
              <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{resume.summary || '-'}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border-2 border-blue-300 p-5 space-y-4">
        <h3 className="font-mono text-sm text-gray-400">// editResume()</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditableInput label="title" value={draft.title || ''} onChange={(v) => setDraftField('title', v)} />
          <EditableInput label="firstName" value={draft.firstName || ''} onChange={(v) => setDraftField('firstName', v)} />
          <EditableInput label="middleName" value={draft.middleName || ''} onChange={(v) => setDraftField('middleName', v)} />
          <EditableInput label="lastName" value={draft.lastName || ''} onChange={(v) => setDraftField('lastName', v)} />
          <EditableInput label="resumeEmail" value={draft.resumeEmail || ''} onChange={(v) => setDraftField('resumeEmail', v)} />
          <EditableInput label="phoneNumber" value={draft.phoneNumber || ''} onChange={(v) => setDraftField('phoneNumber', v)} />
          <EditableInput label="country" value={draft.country || ''} onChange={(v) => setDraftField('country', v)} />
          <EditableInput
            label="dateOfBirth"
            value={draft.dateOfBirth || ''}
            onChange={(v) => setDraftField('dateOfBirth', v)}
            inputType="date"
          />
          <EditableInput label="yearOfGraduation" value={draft.yearOfGraduation || ''} onChange={(v) => setDraftField('yearOfGraduation', v)} />
          <EditableInput label="linkedIn" value={draft.linkedIn || ''} onChange={(v) => setDraftField('linkedIn', v)} />
          <EditableInput label="github" value={draft.github || ''} onChange={(v) => setDraftField('github', v)} />
          <EditableInput label="personalPortfolio" value={draft.personalPortfolio || ''} onChange={(v) => setDraftField('personalPortfolio', v)} />
          <EditableInput label="leetCode" value={draft.leetCode || ''} onChange={(v) => setDraftField('leetCode', v)} />
          <EditableInput label="codingProfile2" value={draft.codingProfile2 || ''} onChange={(v) => setDraftField('codingProfile2', v)} />
          <EditableInput label="codingProfile3" value={draft.codingProfile3 || ''} onChange={(v) => setDraftField('codingProfile3', v)} />
          <div className="sm:col-span-2">
            <EditableInput label="address" value={draft.address || ''} onChange={(v) => setDraftField('address', v)} />
          </div>
        </div>
        <EditableTextarea label="summary" value={draft.summary || ''} onChange={(v) => setDraftField('summary', v)} />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              void saveWith(async () => {
                await updateApi.updateResume({
                  id: resume.id,
                  title: cleanNullable(draft.title || ''),
                  firstName: cleanNullable(draft.firstName || ''),
                  middleName: cleanNullable(draft.middleName || ''),
                  lastName: cleanNullable(draft.lastName || ''),
                  country: cleanNullable(draft.country || ''),
                  phoneNumber: cleanNullable(draft.phoneNumber || ''),
                  resumeEmail: cleanNullable(draft.resumeEmail || ''),
                  dateOfBirth: cleanNullable(draft.dateOfBirth || ''),
                  linkedIn: cleanNullable(draft.linkedIn || ''),
                  github: cleanNullable(draft.github || ''),
                  personalPortfolio: cleanNullable(draft.personalPortfolio || ''),
                  leetCode: cleanNullable(draft.leetCode || ''),
                  codingProfile2: cleanNullable(draft.codingProfile2 || ''),
                  codingProfile3: cleanNullable(draft.codingProfile3 || ''),
                  summary: cleanNullable(draft.summary || ''),
                  address: cleanNullable(draft.address || ''),
                  yearOfGraduation: cleanNullableNumber(draft.yearOfGraduation || ''),
                });
              })
            }
            className="px-4 py-2 bg-black text-white rounded-lg border-2 border-black hover:bg-blue-600 hover:border-blue-600 font-mono text-sm disabled:opacity-60"
          >
            {isSaving ? 'saving...' : 'save()'}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={cancelEdit}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-red-500 hover:text-red-600 font-mono text-sm"
          >
            cancel()
          </button>
        </div>
      </div>
    );
  };

  const renderEducation = (items: EducationRecord[]) => {
    if (!items.length) return <EmptyState label="education" />;
    return (
      <div className="space-y-4">
        {items.map((edu) => {
          const key = `education:${edu.id}`;
          const isEditing = editingKey === key;

          if (!isEditing) {
            return (
              <div key={edu.id} className="bg-white rounded-xl border-2 border-gray-200 p-5 space-y-3 hover:border-blue-300 transition-colors">
                <div className="flex justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{edu.instituteName || 'Institution'}</h4>
                    <p className="text-sm text-gray-600">{edu.degree || '-'}{edu.branch ? ` — ${edu.branch}` : ''}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <DateRange start={edu.startDate} end={edu.endDate} />
                    <button
                      type="button"
                      onClick={() => beginEdit(key, edu)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-mono text-xs hover:border-blue-500 hover:text-blue-700"
                    >
                      edit()
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 text-xs font-mono text-gray-500">
                  <span>level: {edu.level || '-'}</span>
                  <span>location: {edu.location || '-'}</span>
                  <span>grade: {edu.grade || '-'}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={edu.id} className="bg-white rounded-xl border-2 border-blue-300 p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditableInput label="instituteName" value={draft.instituteName || ''} onChange={(v) => setDraftField('instituteName', v)} />
                <EditableInput label="level" value={draft.level || ''} onChange={(v) => setDraftField('level', v)} />
                <EditableInput label="degree" value={draft.degree || ''} onChange={(v) => setDraftField('degree', v)} />
                <EditableInput label="branch" value={draft.branch || ''} onChange={(v) => setDraftField('branch', v)} />
                <EditableInput label="startDate" value={draft.startDate || ''} onChange={(v) => setDraftField('startDate', v)} />
                <EditableInput label="endDate" value={draft.endDate || ''} onChange={(v) => setDraftField('endDate', v)} />
                <EditableInput label="location" value={draft.location || ''} onChange={(v) => setDraftField('location', v)} />
                <EditableInput label="grade" value={draft.grade || ''} onChange={(v) => setDraftField('grade', v)} />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    void saveWith(async () => {
                      await updateApi.updateEducation({
                        resumeId: edu.resumeId,
                        educationId: edu.id,
                        instituteName: cleanNullable(draft.instituteName || ''),
                        level: cleanNullable(draft.level || ''),
                        degree: cleanNullable(draft.degree || ''),
                        branch: cleanNullable(draft.branch || ''),
                        startDate: cleanNullable(draft.startDate || ''),
                        endDate: cleanNullable(draft.endDate || ''),
                        location: cleanNullable(draft.location || ''),
                        grade: cleanNullable(draft.grade || ''),
                      });
                    })
                  }
                  className="px-4 py-2 bg-black text-white rounded-lg border-2 border-black hover:bg-blue-600 hover:border-blue-600 font-mono text-sm disabled:opacity-60"
                >
                  {isSaving ? 'saving...' : 'save()'}
                </button>
                <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-red-500 hover:text-red-600 font-mono text-sm">
                  cancel()
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderExperience = (items: ExperienceRecord[]) => {
    if (!items.length) return <EmptyState label="experience" />;
    return (
      <div className="space-y-4">
        {items.map((exp) => {
          const key = `experience:${exp.id}`;
          const isEditing = editingKey === key;

          if (!isEditing) {
            return (
              <div key={exp.id} className="bg-white rounded-xl border-2 border-gray-200 p-5 space-y-3 hover:border-blue-300 transition-colors">
                <div className="flex justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{exp.companyName || 'Company'}</h4>
                    <p className="text-sm text-gray-600">{exp.position || '-'}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <DateRange start={exp.startDate} end={exp.endDate} />
                    <button
                      type="button"
                      onClick={() => beginEdit(key, exp)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-mono text-xs hover:border-blue-500 hover:text-blue-700"
                    >
                      edit()
                    </button>
                  </div>
                </div>
                <p className="text-xs font-mono text-gray-500">type: {exp.type || '-'}</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{exp.description || '-'}</p>
              </div>
            );
          }

          return (
            <div key={exp.id} className="bg-white rounded-xl border-2 border-blue-300 p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditableInput label="companyName" value={draft.companyName || ''} onChange={(v) => setDraftField('companyName', v)} />
                <EditableInput label="position" value={draft.position || ''} onChange={(v) => setDraftField('position', v)} />
                <EditableInput label="location" value={draft.location || ''} onChange={(v) => setDraftField('location', v)} />
                <label className="space-y-1 block">
                  <span className={labelClass}>type</span>
                  <select className={inputClass} value={draft.type || ''} onChange={(e) => setDraftField('type', e.target.value)}>
                    <option value="">Select type</option>
                    {EXP_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <EditableInput label="startDate" value={draft.startDate || ''} onChange={(v) => setDraftField('startDate', v)} />
                <EditableInput label="endDate" value={draft.endDate || ''} onChange={(v) => setDraftField('endDate', v)} />
                <EditableInput label="proofLink" value={draft.proofLink || ''} onChange={(v) => setDraftField('proofLink', v)} />
              </div>
              <EditableTextarea label="description" value={draft.description || ''} onChange={(v) => setDraftField('description', v)} />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    void saveWith(async () => {
                      await updateApi.updateExperience({
                        resumeId: exp.resumeId,
                        experienceId: exp.id,
                        companyName: cleanNullable(draft.companyName || ''),
                        position: cleanNullable(draft.position || ''),
                        location: cleanNullable(draft.location || ''),
                        type: cleanNullable(draft.type || ''),
                        startDate: cleanNullable(draft.startDate || ''),
                        endDate: cleanNullable(draft.endDate || ''),
                        proofLink: cleanNullable(draft.proofLink || ''),
                        description: cleanNullable(draft.description || ''),
                      });
                    })
                  }
                  className="px-4 py-2 bg-black text-white rounded-lg border-2 border-black hover:bg-blue-600 hover:border-blue-600 font-mono text-sm disabled:opacity-60"
                >
                  {isSaving ? 'saving...' : 'save()'}
                </button>
                <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-red-500 hover:text-red-600 font-mono text-sm">
                  cancel()
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderProjects = (items: ProjectRecord[]) => {
    if (!items.length) return <EmptyState label="projects" />;
    return (
      <div className="space-y-4">
        {items.map((proj) => {
          const key = `projects:${proj.id}`;
          const isEditing = editingKey === key;

          if (!isEditing) {
            return (
              <div key={proj.id} className="bg-white rounded-xl border-2 border-gray-200 p-5 space-y-3 hover:border-blue-300 transition-colors">
                <div className="flex justify-between gap-2">
                  <h4 className="font-semibold text-gray-900">{proj.projectName || 'Project'}</h4>
                  <button
                    type="button"
                    onClick={() => beginEdit(key, { ...proj, techStack: (proj.techStack || []).join(', ') } as Record<string, string | null | undefined>)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-mono text-xs hover:border-blue-500 hover:text-blue-700"
                  >
                    edit()
                  </button>
                </div>
                <DateRange start={proj.startDate} end={proj.endDate} />
                <p className="text-sm text-gray-700 whitespace-pre-line">{proj.description || '-'}</p>
                <p className="text-xs font-mono text-gray-500">techStack: {(proj.techStack || []).join(', ') || '-'}</p>
              </div>
            );
          }

          return (
            <div key={proj.id} className="bg-white rounded-xl border-2 border-blue-300 p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditableInput label="projectName" value={draft.projectName || ''} onChange={(v) => setDraftField('projectName', v)} />
                <EditableInput label="techStack (comma separated)" value={draft.techStack || ''} onChange={(v) => setDraftField('techStack', v)} />
                <EditableInput label="githubLink" value={draft.githubLink || ''} onChange={(v) => setDraftField('githubLink', v)} />
                <EditableInput label="liveLink" value={draft.liveLink || ''} onChange={(v) => setDraftField('liveLink', v)} />
                <EditableInput label="startDate" value={draft.startDate || ''} onChange={(v) => setDraftField('startDate', v)} />
                <EditableInput label="endDate" value={draft.endDate || ''} onChange={(v) => setDraftField('endDate', v)} />
              </div>
              <EditableTextarea label="description" value={draft.description || ''} onChange={(v) => setDraftField('description', v)} />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    void saveWith(async () => {
                      await updateApi.updateProject({
                        resumeId: proj.resumeId,
                        projectId: proj.id,
                        projectName: cleanNullable(draft.projectName || ''),
                        techStack: (draft.techStack || '').split(',').map((v) => v.trim()).filter(Boolean),
                        githubLink: cleanNullable(draft.githubLink || ''),
                        liveLink: cleanNullable(draft.liveLink || ''),
                        startDate: cleanNullable(draft.startDate || ''),
                        endDate: cleanNullable(draft.endDate || ''),
                        description: cleanNullable(draft.description || ''),
                      });
                    })
                  }
                  className="px-4 py-2 bg-black text-white rounded-lg border-2 border-black hover:bg-blue-600 hover:border-blue-600 font-mono text-sm disabled:opacity-60"
                >
                  {isSaving ? 'saving...' : 'save()'}
                </button>
                <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-red-500 hover:text-red-600 font-mono text-sm">
                  cancel()
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSkills = (items: SkillRecord[]) => {
    if (!items.length) return <EmptyState label="skills" />;
    return (
      <div className="space-y-4">
        {items.map((skill) => {
          const key = `skills:${skill.id}`;
          const isEditing = editingKey === key;
          if (!isEditing) {
            return (
              <div key={skill.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 flex items-center justify-between gap-3 hover:border-blue-300 transition-colors">
                <div>
                  <p className="text-gray-900 font-medium">{skill.name || '-'}</p>
                  <p className="text-xs font-mono text-gray-500">{skill.category || 'Other'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => beginEdit(key, skill)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-mono text-xs hover:border-blue-500 hover:text-blue-700"
                >
                  edit()
                </button>
              </div>
            );
          }

          return (
            <div key={skill.id} className="bg-white rounded-xl border-2 border-blue-300 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditableInput label="name" value={draft.name || ''} onChange={(v) => setDraftField('name', v)} />
                <EditableInput label="category" value={draft.category || ''} onChange={(v) => setDraftField('category', v)} />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    void saveWith(async () => {
                      await updateApi.updateSkill({
                        resumeId: skill.resumeId,
                        skillId: skill.id,
                        name: cleanNullable(draft.name || ''),
                        category: cleanNullable(draft.category || ''),
                      });
                    })
                  }
                  className="px-4 py-2 bg-black text-white rounded-lg border-2 border-black hover:bg-blue-600 hover:border-blue-600 font-mono text-sm disabled:opacity-60"
                >
                  {isSaving ? 'saving...' : 'save()'}
                </button>
                <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-red-500 hover:text-red-600 font-mono text-sm">
                  cancel()
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAchievements = (items: AchievementRecord[]) => {
    if (!items.length) return <EmptyState label="achievements" />;
    return (
      <div className="space-y-4">
        {items.map((ach) => {
          const key = `achievements:${ach.id}`;
          const isEditing = editingKey === key;
          if (!isEditing) {
            return (
              <div key={ach.id} className="bg-white rounded-xl border-2 border-gray-200 p-5 space-y-2 hover:border-blue-300 transition-colors">
                <div className="flex justify-between gap-2">
                  <h4 className="font-semibold text-gray-900">{ach.title || 'Achievement'}</h4>
                  <button
                    type="button"
                    onClick={() => beginEdit(key, ach)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-mono text-xs hover:border-blue-500 hover:text-blue-700"
                  >
                    edit()
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-500">org: {ach.org || '-'} | date: {ach.date || '-'}</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{ach.description || '-'}</p>
              </div>
            );
          }

          return (
            <div key={ach.id} className="bg-white rounded-xl border-2 border-blue-300 p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditableInput label="title" value={draft.title || ''} onChange={(v) => setDraftField('title', v)} />
                <EditableInput label="org" value={draft.org || ''} onChange={(v) => setDraftField('org', v)} />
                <EditableInput label="date" value={draft.date || ''} onChange={(v) => setDraftField('date', v)} />
              </div>
              <EditableTextarea label="description" value={draft.description || ''} onChange={(v) => setDraftField('description', v)} />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    void saveWith(async () => {
                      await updateApi.updateAchievement({
                        resumeId: ach.resumeId,
                        achievementId: ach.id,
                        title: cleanNullable(draft.title || ''),
                        org: cleanNullable(draft.org || ''),
                        date: cleanNullable(draft.date || ''),
                        description: cleanNullable(draft.description || ''),
                      });
                    })
                  }
                  className="px-4 py-2 bg-black text-white rounded-lg border-2 border-black hover:bg-blue-600 hover:border-blue-600 font-mono text-sm disabled:opacity-60"
                >
                  {isSaving ? 'saving...' : 'save()'}
                </button>
                <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-red-500 hover:text-red-600 font-mono text-sm">
                  cancel()
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPors = (items: PorRecord[]) => {
    if (!items.length) return <EmptyState label="positions of responsibility" />;
    return (
      <div className="space-y-4">
        {items.map((por) => {
          const key = `pors:${por.id}`;
          const isEditing = editingKey === key;
          if (!isEditing) {
            return (
              <div key={por.id} className="bg-white rounded-xl border-2 border-gray-200 p-5 space-y-2 hover:border-blue-300 transition-colors">
                <div className="flex justify-between gap-2">
                  <h4 className="font-semibold text-gray-900">{por.title || 'Role'}</h4>
                  <button
                    type="button"
                    onClick={() => beginEdit(key, por)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-mono text-xs hover:border-blue-500 hover:text-blue-700"
                  >
                    edit()
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-500">org: {por.org || '-'}</p>
                <DateRange start={por.startDate} end={por.endDate} />
                <p className="text-sm text-gray-700 whitespace-pre-line">{por.description || '-'}</p>
              </div>
            );
          }

          return (
            <div key={por.id} className="bg-white rounded-xl border-2 border-blue-300 p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditableInput label="title" value={draft.title || ''} onChange={(v) => setDraftField('title', v)} />
                <EditableInput label="org" value={draft.org || ''} onChange={(v) => setDraftField('org', v)} />
                <EditableInput label="startDate" value={draft.startDate || ''} onChange={(v) => setDraftField('startDate', v)} />
                <EditableInput label="endDate" value={draft.endDate || ''} onChange={(v) => setDraftField('endDate', v)} />
              </div>
              <EditableTextarea label="description" value={draft.description || ''} onChange={(v) => setDraftField('description', v)} />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    void saveWith(async () => {
                      await updateApi.updatePor({
                        resumeId: por.resumeId,
                        porId: por.id,
                        title: cleanNullable(draft.title || ''),
                        org: cleanNullable(draft.org || ''),
                        startDate: cleanNullable(draft.startDate || ''),
                        endDate: cleanNullable(draft.endDate || ''),
                        description: cleanNullable(draft.description || ''),
                      });
                    })
                  }
                  className="px-4 py-2 bg-black text-white rounded-lg border-2 border-black hover:bg-blue-600 hover:border-blue-600 font-mono text-sm disabled:opacity-60"
                >
                  {isSaving ? 'saving...' : 'save()'}
                </button>
                <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-red-500 hover:text-red-600 font-mono text-sm">
                  cancel()
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPublications = (items: PublicationRecord[]) => {
    if (!items.length) return <EmptyState label="publications" />;
    return (
      <div className="space-y-4">
        {items.map((pub) => {
          const key = `publications:${pub.id}`;
          const isEditing = editingKey === key;
          if (!isEditing) {
            return (
              <div key={pub.id} className="bg-white rounded-xl border-2 border-gray-200 p-5 space-y-2 hover:border-blue-300 transition-colors">
                <div className="flex justify-between gap-2">
                  <h4 className="font-semibold text-gray-900">{pub.title || 'Publication'}</h4>
                  <button
                    type="button"
                    onClick={() => beginEdit(key, pub)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-mono text-xs hover:border-blue-500 hover:text-blue-700"
                  >
                    edit()
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-500">authors: {pub.authors || '-'}</p>
                <p className="text-sm text-gray-600">{pub.conference || '-'}{pub.place ? `, ${pub.place}` : ''}</p>
                <p className="text-xs font-mono text-gray-500">publicationDate: {pub.publicationDate || '-'}</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{pub.description || '-'}</p>
              </div>
            );
          }

          return (
            <div key={pub.id} className="bg-white rounded-xl border-2 border-blue-300 p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EditableInput label="authors" value={draft.authors || ''} onChange={(v) => setDraftField('authors', v)} />
                <EditableInput label="title" value={draft.title || ''} onChange={(v) => setDraftField('title', v)} />
                <EditableInput label="conference" value={draft.conference || ''} onChange={(v) => setDraftField('conference', v)} />
                <EditableInput label="place" value={draft.place || ''} onChange={(v) => setDraftField('place', v)} />
                <EditableInput label="publicationDate" value={draft.publicationDate || ''} onChange={(v) => setDraftField('publicationDate', v)} />
              </div>
              <EditableTextarea label="description" value={draft.description || ''} onChange={(v) => setDraftField('description', v)} />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    void saveWith(async () => {
                      await updateApi.updatePublication({
                        resumeId: pub.resumeId,
                        publicationId: pub.id,
                        authors: cleanNullable(draft.authors || ''),
                        title: cleanNullable(draft.title || ''),
                        conference: cleanNullable(draft.conference || ''),
                        place: cleanNullable(draft.place || ''),
                        publicationDate: cleanNullable(draft.publicationDate || ''),
                        description: cleanNullable(draft.description || ''),
                      });
                    })
                  }
                  className="px-4 py-2 bg-black text-white rounded-lg border-2 border-black hover:bg-blue-600 hover:border-blue-600 font-mono text-sm disabled:opacity-60"
                >
                  {isSaving ? 'saving...' : 'save()'}
                </button>
                <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-red-500 hover:text-red-600 font-mono text-sm">
                  cancel()
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen pt-24 pb-16 bg-linear-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-56 h-56 bg-red-500/10 rounded-2xl rotate-45 blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
        <section className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-gray-200/50 p-5 md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-mono text-gray-400 mb-1">
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">dashboard</Link>
                {' '}<span className="text-gray-300">/</span>{' '}resume
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                <span className="font-mono text-blue-600">{'<'}</span>
                {isLoading ? '...' : headingName}
                <span className="font-mono text-blue-600">{'/>'}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 self-start">
              {resume && (
                <button
                  id="export-pdf-btn"
                  type="button"
                  onClick={() => void handleExportPdf()}
                  disabled={isExporting || isLoading}
                  className="px-4 py-2 text-sm font-mono bg-black text-white border-2 border-black rounded-lg hover:bg-blue-600 hover:border-blue-600 transition-all shadow-md hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isExporting ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      compiling...
                    </>
                  ) : (
                    <>↓ exportPDF()</>
                  )}
                </button>
              )}
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-mono text-gray-700 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all"
              >
                ← back()
              </Link>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />
          </div>
        ) : resume ? (
          <>
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow border-2 border-gray-200/50 p-2 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const count = tabCounts[tab.key];
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.key);
                        cancelEdit();
                      }}
                      className={`px-3 py-2 rounded-lg font-mono text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-black text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {tab.label}
                      {tab.key !== 'overview' && (
                        <span
                          className={`text-xs rounded-full px-1.5 py-0.5 font-mono ${
                            isActive
                              ? count > 0 ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-200'
                              : count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow border-2 border-gray-200/50 p-5 md:p-7">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'education' && renderEducation(resume.education)}
              {activeTab === 'experience' && renderExperience(resume.experience)}
              {activeTab === 'projects' && renderProjects(resume.projects)}
              {activeTab === 'skills' && renderSkills(resume.skills)}
              {activeTab === 'achievements' && renderAchievements(resume.achievements)}
              {activeTab === 'pors' && renderPors(resume.pors)}
              {activeTab === 'publications' && renderPublications(resume.publications)}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
