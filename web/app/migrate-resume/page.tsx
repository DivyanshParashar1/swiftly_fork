'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import {
  ApiError,
  resumeApi,
  migrateApi,
  type ResumeRecord,
  type ResumeDetailRecord,
  type LatexTemplate,
  type TemplateMeta,
} from '@/lib/api';
import { clearAuthUser } from '@/lib/authSession';
import { useMigrationState } from '@/features/migrate/useMigrationState';
import UserInputForm from '@/features/migrate/UserInputForm';
import SectionBuilder from '@/features/migrate/SectionBuilder';
import ExportPanel from '@/features/migrate/ExportPanel';
import {
  extractUserInputFields,
  type TemplateSchema,
  type UserInputField,
} from '@/features/migrate/types';

// ─── Step definitions ─────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

function StepBar({ current, hasUserInputStep }: { current: Step; hasUserInputStep: boolean }) {
  const steps = [
    { n: 1 as Step, label: 'selectResume()' },
    { n: 2 as Step, label: 'pickTemplate()' },
    ...(hasUserInputStep ? [{ n: 3 as Step, label: 'fillDetails()' }] : []),
    { n: (hasUserInputStep ? 4 : 3) as Step, label: 'buildResume()' },
  ];

  return (
    <div className="flex items-center gap-0 mb-8 flex-wrap gap-y-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm transition-all ${
              current === s.n
                ? 'bg-black text-white'
                : current > s.n
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            <span
              className={
                current > s.n ? 'text-green-500' : current === s.n ? 'text-blue-400' : 'text-gray-400'
              }
            >
              {current > s.n ? '✓' : `${s.n}`}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 h-px mx-1 ${current > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Builder screen (Steps 3/4 — section builder + export) ───────────────────

function BuilderScreen({
  resume,
  template,
  meta,
}: {
  resume: ResumeDetailRecord;
  template: LatexTemplate;
  meta: TemplateMeta;
}) {
  const {
    sections,
    userInputs,
    migrationConfig,
    visibleCount,
    reorderSections,
    toggleSectionVisibility,
    toggleItemVisibility,
    setUserInput,
    resetToDefault,
  } = useMigrationState(resume, meta);

  return (
    <div className="space-y-5">
      {/* Section Builder */}
      <SectionBuilder
        sections={sections}
        onReorder={reorderSections}
        onToggleSection={toggleSectionVisibility}
        onToggleItem={toggleItemVisibility}
        onReset={resetToDefault}
        visibleCount={visibleCount}
      />

      {/* Export Panel */}
      <ExportPanel
        resume={resume}
        template={template}
        migrationConfig={migrationConfig}
        visibleCount={visibleCount}
      />
    </div>
  );
}

// ─── User Input + Builder combined screen ─────────────────────────────────────

function UserInputAndBuilderScreen({
  resume,
  template,
  meta,
  schema,
  userInputFields,
}: {
  resume: ResumeDetailRecord;
  template: LatexTemplate;
  meta: TemplateMeta;
  schema: TemplateSchema;
  userInputFields: UserInputField[];
}) {
  const {
    sections,
    userInputs,
    migrationConfig,
    visibleCount,
    reorderSections,
    toggleSectionVisibility,
    toggleItemVisibility,
    setUserInput,
    resetToDefault,
  } = useMigrationState(resume, meta);

  const hasAllInputs = userInputFields.every((f) => userInputs[f.key]?.trim());

  return (
    <div className="space-y-5">
      {/* USER_INPUT form */}
      <UserInputForm
        fields={userInputFields}
        values={userInputs}
        onChange={setUserInput}
        resume={resume}
      />

      {/* Section Builder — shown always but gated by a subtle warning if inputs missing */}
      {hasAllInputs ? (
        <SectionBuilder
          sections={sections}
          onReorder={reorderSections}
          onToggleSection={toggleSectionVisibility}
          onToggleItem={toggleItemVisibility}
          onReset={resetToDefault}
          visibleCount={visibleCount}
        />
      ) : (
        <div className="bg-white/60 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
          <p className="font-mono text-gray-400 text-sm">
            // Fill in the required fields above to unlock the section builder
          </p>
        </div>
      )}

      {/* Export Panel */}
      <ExportPanel
        resume={resume}
        template={template}
        migrationConfig={migrationConfig}
        visibleCount={visibleCount}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MigrateResumePage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [step, setStep] = useState<Step>(1);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [templates, setTemplates] = useState<LatexTemplate[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeDetailRecord | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<LatexTemplate | null>(null);
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null);
  const [templateSchema, setTemplateSchema] = useState<TemplateSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const userInputFields = useMemo(
    () => (templateSchema ? extractUserInputFields(templateSchema as TemplateSchema) : []),
    [templateSchema]
  );

  const hasUserInputStep = userInputFields.length > 0;

  // ── Initial data load ──────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [resumesRes, templatesRes] = await Promise.all([
          resumeApi.fetchResumeForUser(),
          migrateApi.listTemplates(),
        ]);
        setResumes(resumesRes.data || []);
        setTemplates(templatesRes.data || []);
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          clearAuthUser();
          enqueueSnackbar('Please sign in', { variant: 'warning' });
          router.push('/signin');
          return;
        }
        enqueueSnackbar('Failed to load data', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [enqueueSnackbar, router]);

  // ── Resume selection ───────────────────────────────────────────────────────

  const selectResume = useCallback(
    async (r: ResumeRecord) => {
      setIsLoading(true);
      try {
        const res = await resumeApi.fetchResumeById(r.id);
        const detail = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!detail) throw new Error('Not found');
        setSelectedResume(detail as ResumeDetailRecord);
        setStep(2);
      } catch {
        enqueueSnackbar('Failed to load resume details', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    },
    [enqueueSnackbar]
  );

  // ── Template selection ─────────────────────────────────────────────────────

  const selectTemplate = useCallback(
    async (t: LatexTemplate) => {
      setSelectedTemplate(t);
      setIsLoadingTemplate(true);
      try {
        // Load meta + schema in parallel
        const [metaRes, schemaRes] = await Promise.allSettled([
          migrateApi.getTemplateMeta(t.id),
          migrateApi.getTemplateSchema(t.id),
        ]);

        const meta: TemplateMeta =
          metaRes.status === 'fulfilled'
            ? metaRes.value.data
            : {
                id: t.id,
                supportsSectionReordering: true,
                supportsItemVisibility: true,
                requiredUserInputs: [],
                defaultSectionOrder: [
                  'summary', 'education', 'experience', 'projects', 'skills', 'achievements', 'por', 'publications',
                ],
              };

        const schema: TemplateSchema | null =
          schemaRes.status === 'fulfilled' ? (schemaRes.value.data as TemplateSchema) : null;

        setTemplateMeta(meta);
        setTemplateSchema(schema);
        setStep(3);
      } catch {
        enqueueSnackbar('Failed to load template configuration', { variant: 'error' });
      } finally {
        setIsLoadingTemplate(false);
      }
    },
    [enqueueSnackbar]
  );

  // ── Step 3/4 determination ─────────────────────────────────────────────────
  // With hasUserInputStep: 1 → 2 → 3 (USER_INPUT + builder) — shown in one combined screen
  // Without: 1 → 2 → 3 (builder only)
  // We keep step 3 as the "final" step in both cases for simplicity.

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-gray-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Page header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-xs font-mono text-gray-400 hover:text-blue-600 transition-colors"
          >
            ← dashboard()
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">
            <span className="font-mono text-indigo-600">{'<'}</span>
            {' '}Migrate Resume{' '}
            <span className="font-mono text-indigo-600">{'/>'}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-mono">
            // select resume → pick template → build sections → export PDF
          </p>
        </div>

        <StepBar current={step} hasUserInputStep={hasUserInputStep} />

        {/* Loading skeletons */}
        {isLoading && step === 1 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── STEP 1: Select resume ──────────────────────────────────────── */}
        {!isLoading && step === 1 && (
          <section className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200/60 shadow-xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5 font-mono">
              // 01. Select a resume
            </h2>
            {resumes.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <p className="font-mono text-gray-500 text-sm">// no resumes in your account</p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                  <Link
                    href="/upload-resume"
                    className="inline-block px-5 py-2 bg-black text-white rounded-lg hover:bg-blue-600 transition-all font-mono text-sm border-2 border-black"
                  >
                    uploadResume()
                  </Link>
                  <Link
                    href="/create-resume"
                    className="inline-block px-5 py-2 bg-white text-gray-900 rounded-lg hover:bg-indigo-600 hover:text-white transition-all font-mono text-sm border-2 border-gray-300 hover:border-indigo-600"
                  >
                    + createResume()
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resumes.map((r) => {
                  const name = [r.firstName, r.lastName].filter(Boolean).join(' ');
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => void selectResume(r)}
                      className="text-left rounded-xl border-2 border-gray-200 bg-white p-4 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-100 transition-all group"
                    >
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {r.title || name || 'Untitled Resume'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 font-mono">
                        {r.resumeEmail || 'no email'}
                      </p>
                      <span className="text-xs font-mono text-indigo-400 mt-2 inline-block group-hover:text-indigo-600">
                        select() →
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── STEP 2: Pick template ──────────────────────────────────────── */}
        {step === 2 && (
          <section className="space-y-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200/60 shadow-xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900 font-mono">
                  // 02. Pick a template
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-mono text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors"
                >
                  ← back
                </button>
              </div>

              {selectedResume && (
                <div className="mb-5 px-4 py-2 bg-green-50 border border-green-200 rounded-lg inline-flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="font-mono text-green-700">
                    {selectedResume.title ||
                      [selectedResume.firstName, selectedResume.lastName]
                        .filter(Boolean)
                        .join(' ') ||
                      'Resume'}
                  </span>
                </div>
              )}

              {isLoadingTemplate && (
                <div className="h-12 rounded-xl bg-gray-100 animate-pulse mb-4" />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => void selectTemplate(t)}
                    disabled={isLoadingTemplate}
                    className="text-left rounded-xl border-2 border-gray-200 bg-white overflow-hidden hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100 transition-all group disabled:opacity-50"
                  >
                    <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 border-b-2 border-gray-100 flex items-center justify-center group-hover:from-indigo-50 group-hover:to-indigo-100 transition-all">
                      <div className="text-center">
                        <div className="w-16 h-20 bg-white border-2 border-gray-200 rounded-sm shadow-md mx-auto flex items-center justify-center group-hover:border-indigo-300 transition-colors">
                          <span className="font-mono text-2xl text-gray-300 group-hover:text-indigo-300">
                            Λ
                          </span>
                        </div>
                        <p className="text-xs font-mono text-gray-400 mt-2 group-hover:text-indigo-500">
                          {t.name}.tex
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                      <span className="text-xs font-mono text-indigo-400 mt-3 inline-block group-hover:text-indigo-600">
                        use this template →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── STEP 3: Builder (with or without USER_INPUT form) ──────────── */}
        {step === 3 && selectedResume && selectedTemplate && templateMeta && (
          <section className="space-y-5">
            {/* Header bar */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200/60 shadow-xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-mono">
                    // 03. Build &amp; Export
                  </h2>
                  <p className="text-xs font-mono text-gray-400 mt-1">
                    Template:{' '}
                    <span className="text-indigo-600">{selectedTemplate.name}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-3 py-1.5 text-xs font-mono border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors shrink-0"
                >
                  ← back
                </button>
              </div>
            </div>

            {/* Render combined or plain builder */}
            {hasUserInputStep ? (
              <UserInputAndBuilderScreen
                resume={selectedResume}
                template={selectedTemplate}
                meta={templateMeta}
                schema={templateSchema!}
                userInputFields={userInputFields}
              />
            ) : (
              <BuilderScreen
                resume={selectedResume}
                template={selectedTemplate}
                meta={templateMeta}
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}
