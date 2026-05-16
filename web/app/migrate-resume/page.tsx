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
} from '@/lib/api';
import { clearAuthUser } from '@/lib/authSession';

// ─── Step indicator ──────────────────────────────────────────────────────────
type Step = 1 | 2 | 3;

const STEPS = [
  { n: 1 as Step, label: 'selectResume()' },
  { n: 2 as Step, label: 'pickTemplate()' },
  { n: 3 as Step, label: 'migrate()' },
];

function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm transition-all ${
            current === s.n
              ? 'bg-black text-white'
              : current > s.n
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-gray-100 text-gray-400 border border-gray-200'
          }`}>
            <span className={current > s.n ? 'text-green-500' : current === s.n ? 'text-blue-400' : 'text-gray-400'}>
              {current > s.n ? '✓' : `${s.n}`}
            </span>
            {s.label}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-6 h-px mx-1 ${current > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Shared input styles ─────────────────────────────────────────────────────
const inputClass = 'w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 text-sm font-mono';
const labelClass = 'text-xs font-mono text-blue-600 mb-1 block';
const textareaClass = `${inputClass} min-h-[80px] resize-y`;

function Field({ label, value, onChange, type = 'text', textarea = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {textarea
        ? <textarea className={textareaClass} value={value} onChange={e => onChange(e.target.value)} />
        : <input type={type} className={inputClass} value={value} onChange={e => onChange(e.target.value)} />}
    </label>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function MigrateResumePage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [step, setStep] = useState<Step>(1);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [templates, setTemplates] = useState<LatexTemplate[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeDetailRecord | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<LatexTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);

  // Form state mirrors DB fields directly
  const [form, setForm] = useState({
    firstName: '', middleName: '', lastName: '',
    resumeEmail: '', phoneNumber: '', country: '',
    linkedIn: '', github: '', personalPortfolio: '',
    leetCode: '', summary: '',
  });

  const setF = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  // Load resumes + templates in parallel
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

  // When a resume is selected, fetch its full details and pre-fill the form
  const selectResume = useCallback(async (r: ResumeRecord) => {
    setIsLoading(true);
    try {
      const res = await resumeApi.fetchResumeById(r.id);
      const detail = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!detail) throw new Error('Not found');
      setSelectedResume(detail as ResumeDetailRecord);
      setForm({
        firstName: detail.firstName || '',
        middleName: detail.middleName || '',
        lastName: detail.lastName || '',
        resumeEmail: detail.resumeEmail || '',
        phoneNumber: detail.phoneNumber || '',
        country: detail.country || '',
        linkedIn: detail.linkedIn || '',
        github: detail.github || '',
        personalPortfolio: detail.personalPortfolio || '',
        leetCode: detail.leetCode || '',
        summary: detail.summary || '',
      });
      setStep(2);
    } catch {
      enqueueSnackbar('Failed to load resume details', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [enqueueSnackbar]);

  const selectTemplate = (t: LatexTemplate) => {
    setSelectedTemplate(t);
    setStep(3);
  };

  const handleCompile = async () => {
    if (!selectedResume || !selectedTemplate) return;
    setIsCompiling(true);
    try {
      const blob = await migrateApi.compileToPdf(selectedResume.id, selectedTemplate.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${selectedTemplate.id}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      enqueueSnackbar('PDF downloaded!', { variant: 'success' });
    } catch (err) {
      if (err instanceof ApiError) enqueueSnackbar(err.message, { variant: 'error' });
      else enqueueSnackbar('Compilation failed. Check latex-service is running.', { variant: 'error' });
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-gray-50 via-white to-indigo-50 relative overflow-hidden">
      {/* decorative blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Page header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs font-mono text-gray-400 hover:text-blue-600 transition-colors">
            ← dashboard()
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">
            <span className="font-mono text-indigo-600">{'<'}</span>
            {' '}Migrate Resume{' '}
            <span className="font-mono text-indigo-600">{'/>'}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-mono">
            // select a resume → pick a LaTeX template → export PDF
          </p>
        </div>

        <StepBar current={step} />

        {isLoading && step === 1 && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        )}

        {/* ── STEP 1: Select resume ─────────────────────────────────────── */}
        {!isLoading && step === 1 && (
          <section className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200/60 shadow-xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-5 font-mono">// 01. Select a resume</h2>
            {resumes.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <p className="font-mono text-gray-500 text-sm">// no resumes in your account</p>
                <Link href="/upload-resume" className="inline-block mt-4 px-5 py-2 bg-black text-white rounded-lg hover:bg-blue-600 transition-all font-mono text-sm border-2 border-black">
                  uploadResume()
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resumes.map(r => {
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
                      <p className="text-sm text-gray-500 mt-1 font-mono">{r.resumeEmail || 'no email'}</p>
                      <span className="text-xs font-mono text-indigo-400 mt-2 inline-block group-hover:text-indigo-600">select() →</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── STEP 2: Template marketplace ─────────────────────────────── */}
        {step === 2 && (
          <section className="space-y-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200/60 shadow-xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900 font-mono">// 02. Pick a template</h2>
                <button type="button" onClick={() => setStep(1)} className="text-xs font-mono text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors">
                  ← back
                </button>
              </div>

              {/* Selected resume badge */}
              {selectedResume && (
                <div className="mb-5 px-4 py-2 bg-green-50 border border-green-200 rounded-lg inline-flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="font-mono text-green-700">
                    {selectedResume.title || [selectedResume.firstName, selectedResume.lastName].filter(Boolean).join(' ') || 'Resume'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {templates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t)}
                    className="text-left rounded-xl border-2 border-gray-200 bg-white overflow-hidden hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100 transition-all group"
                  >
                    {/* Preview area */}
                    <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 border-b-2 border-gray-100 flex items-center justify-center group-hover:from-indigo-50 group-hover:to-indigo-100 transition-all">
                      <div className="text-center">
                        <div className="w-16 h-20 bg-white border-2 border-gray-200 rounded-sm shadow-md mx-auto flex items-center justify-center group-hover:border-indigo-300 transition-colors">
                          <span className="font-mono text-2xl text-gray-300 group-hover:text-indigo-300">Λ</span>
                        </div>
                        <p className="text-xs font-mono text-gray-400 mt-2 group-hover:text-indigo-500">{t.name}.tex</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                      <span className="text-xs font-mono text-indigo-400 mt-3 inline-block group-hover:text-indigo-600">use this template →</span>
                    </div>
                  </button>
                ))}

                {/* Upload custom template card */}
                <label className="rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[220px] p-6 text-center">
                  <input
                    type="file"
                    accept=".tex"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const text = await file.text();
                      // Register as a custom template in session state
                      const custom: LatexTemplate = {
                        id: `custom-${Date.now()}`,
                        name: file.name.replace('.tex', ''),
                        description: 'Your custom uploaded template',
                        thumbnail: null,
                      };
                      // Store tex content on window for the compile step
                      (window as any).__customTex = text;
                      setTemplates(prev => {
                        const filtered = prev.filter(t => !t.id.startsWith('custom-'));
                        return [...filtered, custom];
                      });
                      enqueueSnackbar(`Template "${custom.name}" loaded`, { variant: 'success' });
                    }}
                  />
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center mb-3 transition-colors">
                    <span className="text-2xl text-gray-400 group-hover:text-indigo-500">+</span>
                  </div>
                  <p className="font-mono text-sm text-gray-500 group-hover:text-indigo-600">uploadTemplate()</p>
                  <p className="text-xs text-gray-400 mt-1">Upload your own .tex file</p>
                </label>
              </div>
            </div>
          </section>
        )}

        {/* ── STEP 3: Edit form + Compile ──────────────────────────────── */}
        {step === 3 && selectedResume && selectedTemplate && (
          <Step3Form
            resume={selectedResume}
            template={selectedTemplate}
            form={form}
            setF={setF}
            isCompiling={isCompiling}
            onBack={() => setStep(2)}
            onCompile={handleCompile}
          />
        )}
      </div>
    </main>
  );
}

// ─── Step 3 component (split out to keep file manageable) ────────────────────
function Step3Form({ resume, template, form, setF, isCompiling, onBack, onCompile }: {
  resume: ResumeDetailRecord;
  template: LatexTemplate;
  form: Record<string, string>;
  setF: (k: any) => (v: string) => void;
  isCompiling: boolean;
  onBack: () => void;
  onCompile: () => void;
}) {
  const [tab, setTab] = useState<'overview' | 'experience' | 'education' | 'projects' | 'skills' | 'achievements'>('overview');

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'overview', label: 'overview()' },
    { key: 'experience', label: `experience[${resume.experience.length}]` },
    { key: 'education', label: `education[${resume.education.length}]` },
    { key: 'projects', label: `projects[${resume.projects.length}]` },
    { key: 'skills', label: `skills[${resume.skills.length}]` },
    { key: 'achievements', label: `achievements[${resume.achievements.length}]` },
  ];

  return (
    <section className="space-y-5">
      {/* Header bar */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200/60 shadow-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-mono">// 03. Review &amp; Migrate</h2>
            <p className="text-xs font-mono text-gray-400 mt-1">
              Template: <span className="text-indigo-600">{template.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={onBack} className="px-3 py-1.5 text-xs font-mono border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
              ← back
            </button>
            <button
              type="button"
              onClick={onCompile}
              disabled={isCompiling}
              id="migrate-export-btn"
              className="px-5 py-2 bg-black text-white rounded-lg hover:bg-indigo-600 border-2 border-black hover:border-indigo-600 transition-all font-mono text-sm shadow-md hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCompiling ? 'compiling...' : '$ migrate --export-pdf'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200/60 shadow-xl overflow-hidden">
        <div className="flex overflow-x-auto border-b-2 border-gray-100 bg-gray-50/50">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 font-mono text-xs whitespace-nowrap transition-all border-b-2 -mb-0.5 ${
                tab === t.key
                  ? 'border-indigo-500 text-indigo-700 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="firstName" value={form.firstName} onChange={setF('firstName')} />
              <Field label="middleName" value={form.middleName} onChange={setF('middleName')} />
              <Field label="lastName" value={form.lastName} onChange={setF('lastName')} />
              <Field label="resumeEmail" value={form.resumeEmail} onChange={setF('resumeEmail')} type="email" />
              <Field label="phoneNumber" value={form.phoneNumber} onChange={setF('phoneNumber')} />
              <Field label="country" value={form.country} onChange={setF('country')} />
              <Field label="linkedIn" value={form.linkedIn} onChange={setF('linkedIn')} />
              <Field label="github" value={form.github} onChange={setF('github')} />
              <Field label="personalPortfolio" value={form.personalPortfolio} onChange={setF('personalPortfolio')} />
              <Field label="leetCode" value={form.leetCode} onChange={setF('leetCode')} />
              <div className="sm:col-span-2">
                <Field label="summary" value={form.summary} onChange={setF('summary')} textarea />
              </div>
            </div>
          )}

          {tab === 'experience' && (
            <div className="space-y-4">
              {resume.experience.length === 0
                ? <p className="font-mono text-gray-400 text-sm">// no experience entries</p>
                : resume.experience.map((e, i) => (
                  <div key={e.id} className="rounded-xl border-2 border-gray-100 p-4 space-y-1 bg-gray-50">
                    <p className="font-semibold text-gray-900">{e.companyName || `Entry ${i + 1}`}</p>
                    <p className="text-sm text-gray-600">{e.position} · {e.type}</p>
                    <p className="text-xs font-mono text-gray-400">{e.startDate} → {e.endDate || 'present'}</p>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">{e.description}</p>
                  </div>
                ))}
              <p className="text-xs font-mono text-gray-400 mt-2">
                // To edit experience entries, go to{' '}
                <Link href={`/dashboard/resume/${resume.id}`} className="text-indigo-500 hover:underline">
                  dashboard/resume/{resume.id}
                </Link>
              </p>
            </div>
          )}

          {tab === 'education' && (
            <div className="space-y-4">
              {resume.education.length === 0
                ? <p className="font-mono text-gray-400 text-sm">// no education entries</p>
                : resume.education.map((e, i) => (
                  <div key={e.id} className="rounded-xl border-2 border-gray-100 p-4 bg-gray-50">
                    <p className="font-semibold text-gray-900">{e.instituteName || `Entry ${i + 1}`}</p>
                    <p className="text-sm text-gray-600">{e.degree}{e.branch ? ` — ${e.branch}` : ''}</p>
                    <p className="text-xs font-mono text-gray-400">{e.startDate} → {e.endDate} · {e.grade}</p>
                  </div>
                ))}
              <p className="text-xs font-mono text-gray-400 mt-2">
                // To edit entries, go to{' '}
                <Link href={`/dashboard/resume/${resume.id}`} className="text-indigo-500 hover:underline">
                  resume editor
                </Link>
              </p>
            </div>
          )}

          {tab === 'projects' && (
            <div className="space-y-4">
              {resume.projects.length === 0
                ? <p className="font-mono text-gray-400 text-sm">// no project entries</p>
                : resume.projects.map((p, i) => (
                  <div key={p.id} className="rounded-xl border-2 border-gray-100 p-4 bg-gray-50">
                    <p className="font-semibold text-gray-900">{p.projectName || `Project ${i + 1}`}</p>
                    <p className="text-xs font-mono text-indigo-500 mt-1">{(p.techStack || []).join(', ')}</p>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                ))}
              <p className="text-xs font-mono text-gray-400 mt-2">
                // To edit entries, go to{' '}
                <Link href={`/dashboard/resume/${resume.id}`} className="text-indigo-500 hover:underline">
                  resume editor
                </Link>
              </p>
            </div>
          )}

          {tab === 'skills' && (
            <div className="flex flex-wrap gap-2">
              {resume.skills.length === 0
                ? <p className="font-mono text-gray-400 text-sm">// no skill entries</p>
                : resume.skills.map(s => (
                  <span key={s.id} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-mono">
                    {s.name}{s.category ? ` (${s.category})` : ''}
                  </span>
                ))}
            </div>
          )}

          {tab === 'achievements' && (
            <div className="space-y-3">
              {resume.achievements.length === 0
                ? <p className="font-mono text-gray-400 text-sm">// no achievement entries</p>
                : resume.achievements.map((a, i) => (
                  <div key={a.id} className="rounded-xl border-2 border-gray-100 p-4 bg-gray-50">
                    <p className="font-semibold text-gray-900">{a.title || `Achievement ${i + 1}`}</p>
                    <p className="text-xs font-mono text-gray-400">{a.org} · {a.date}</p>
                    <p className="text-sm text-gray-700 mt-1">{a.description}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom compile CTA */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCompile}
          disabled={isCompiling}
          className="px-8 py-3 bg-black text-white rounded-xl hover:bg-indigo-600 border-2 border-black hover:border-indigo-600 transition-all font-mono text-sm shadow-lg hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isCompiling ? '⟳ compiling PDF...' : '$ migrate --export-pdf'}
        </button>
      </div>
    </section>
  );
}
