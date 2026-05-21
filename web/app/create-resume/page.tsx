'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { ApiError, resumeApi, type CreateResumePayload, type CreateEducationEntry, type CreateExperienceEntry, type CreateSkillEntry, type CreateAchievementEntry, type CreatePorEntry, type CreatePublicationEntry } from '@/lib/api';

// ─── Shared style tokens ──────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 text-sm';
const textareaCls = `${inputCls} min-h-20 resize-y`;
const labelCls = 'text-xs font-mono text-blue-600 block mb-1';
const sectionCardCls = 'bg-white rounded-xl border-2 border-gray-200 p-5 space-y-4';
const addBtnCls = 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors';
const removeBtnCls = 'text-xs font-mono text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2 py-1 rounded-md transition-colors';

const EXP_TYPES = ['INTERNSHIP','FULL_TIME','PART_TIME','CONTRACT','FREELANCE','RESEARCH','VOLUNTEER'];

// ─── Field helpers ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className={labelCls}>{label}</span>{children}</label>;
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <Field label={label}><input type={type} className={inputCls} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} /></Field>;
}

function Textarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <Field label={label}><textarea className={textareaCls} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} /></Field>;
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, count, onAdd }: { title: string; count: number; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-mono text-sm text-gray-400">
        // {title} <span className="text-indigo-500">[{count}]</span>
      </h2>
      <button type="button" onClick={onAdd} className={addBtnCls}>
        <span className="text-lg leading-none">+</span> add{title.replace(/\s/g,'')}()
      </button>
    </div>
  );
}

// ─── List item wrapper ────────────────────────────────────────────────────────
function ListItem({ index, onRemove, children }: { index: number; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="border-2 border-gray-100 rounded-xl p-4 space-y-3 relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-mono text-gray-300">#{index + 1}</span>
        <button type="button" onClick={onRemove} className={removeBtnCls}>remove()</button>
      </div>
      {children}
    </div>
  );
}

// ─── Default factories ────────────────────────────────────────────────────────
const newEdu = (): CreateEducationEntry & Record<string,string> => ({ instituteName:'', level:'', degree:'', branch:'', startDate:'', endDate:'', location:'', grade:'' });
const newExp = (): CreateExperienceEntry & Record<string,string> => ({ companyName:'', position:'', location:'', type:'INTERNSHIP', startDate:'', endDate:'', proofLink:'', description:'' });

// ProjRow uses techStack as a plain comma-separated string for the form input
interface ProjRow {
  projectName: string;
  techStack: string;
  description: string;
  githubLink: string;
  liveLink: string;
  startDate: string;
  endDate: string;
}
const newProj = (): ProjRow => ({ projectName:'', techStack:'', description:'', githubLink:'', liveLink:'', startDate:'', endDate:'' });

const newSkill = (): CreateSkillEntry & Record<string,string> => ({ name:'', category:'' });
const newAch = (): CreateAchievementEntry & Record<string,string> => ({ title:'', org:'', date:'', description:'' });
const newPor = (): CreatePorEntry & Record<string,string> => ({ title:'', org:'', startDate:'', endDate:'', description:'' });
const newPub = (): CreatePublicationEntry & Record<string,string> => ({ authors:'', title:'', conference:'', place:'', publicationDate:'', description:'' });

function n(v: string): string | null { return v.trim() === '' ? null : v.trim(); }
function num(v: string): number | null { const x = Number(v.trim()); return v.trim() === '' || isNaN(x) ? null : x; }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CreateResumePage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Personal
  const [personal, setPersonal] = useState({
    title:'', firstName:'', middleName:'', lastName:'', resumeEmail:'', phoneNumber:'',
    country:'', dateOfBirth:'', address:'', yearOfGraduation:'', linkedIn:'', github:'',
    personalPortfolio:'', leetCode:'', codingProfile2:'', codingProfile3:'', summary:'',
  });
  const sp = (k: keyof typeof personal) => (v: string) => setPersonal(prev => ({ ...prev, [k]: v }));

  // Lists
  type EduRow = CreateEducationEntry & Record<string,string>;
  type ExpRow = CreateExperienceEntry & Record<string,string>;
  type SkillRow = CreateSkillEntry & Record<string,string>;
  type AchRow = CreateAchievementEntry & Record<string,string>;
  type PorRow = CreatePorEntry & Record<string,string>;
  type PubRow = CreatePublicationEntry & Record<string,string>;

  const [education, setEducation] = useState<EduRow[]>([]);
  const [experience, setExperience] = useState<ExpRow[]>([]);
  const [projects, setProjects] = useState<ProjRow[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [achievements, setAchievements] = useState<AchRow[]>([]);
  const [pors, setPors] = useState<PorRow[]>([]);
  const [publications, setPublications] = useState<PubRow[]>([]);

  function updateRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number, key: string, value: string) {
    setter(prev => prev.map((row, i) => i === index ? { ...row, [key]: value } : row));
  }
  function removeRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number) {
    setter(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: CreateResumePayload = {
        title: n(personal.title),
        firstName: n(personal.firstName),
        middleName: n(personal.middleName),
        lastName: n(personal.lastName),
        resumeEmail: n(personal.resumeEmail),
        phoneNumber: n(personal.phoneNumber),
        country: n(personal.country),
        dateOfBirth: n(personal.dateOfBirth),
        address: n(personal.address),
        yearOfGraduation: num(personal.yearOfGraduation),
        linkedIn: n(personal.linkedIn),
        github: n(personal.github),
        personalPortfolio: n(personal.personalPortfolio),
        leetCode: n(personal.leetCode),
        codingProfile2: n(personal.codingProfile2),
        codingProfile3: n(personal.codingProfile3),
        summary: n(personal.summary),
        education: education.map(e => ({ instituteName:n(e.instituteName||''), level:n(e.level||''), degree:n(e.degree||''), branch:n(e.branch||''), startDate:n(e.startDate||''), endDate:n(e.endDate||''), location:n(e.location||''), grade:n(e.grade||'') })),
        experience: experience.map(e => ({ companyName:n(e.companyName||''), position:n(e.position||''), location:n(e.location||''), type:e.type||'INTERNSHIP', startDate:n(e.startDate||''), endDate:n(e.endDate||''), proofLink:n(e.proofLink||''), description:n(e.description||'') })),
        projects: projects.map(p => ({ projectName:n(p.projectName||''), techStack:(p.techStack||'').split(',').map((s:string)=>s.trim()).filter(Boolean), description:n(p.description||''), githubLink:n(p.githubLink||''), liveLink:n(p.liveLink||''), startDate:n(p.startDate||''), endDate:n(p.endDate||'') })),
        skills: skills.map(s => ({ name:n(s.name||''), category:n(s.category||'') })),
        achievements: achievements.map(a => ({ title:n(a.title||''), org:n(a.org||''), date:n(a.date||''), description:n(a.description||'') })),
        pors: pors.map(p => ({ title:n(p.title||''), org:n(p.org||''), startDate:n(p.startDate||''), endDate:n(p.endDate||''), description:n(p.description||'') })),
        publications: publications.map(p => ({ authors:n(p.authors||''), title:n(p.title||''), conference:n(p.conference||''), place:n(p.place||''), publicationDate:n(p.publicationDate||''), description:n(p.description||'') })),
      };
      await resumeApi.createResume(payload);
      enqueueSnackbar('Resume created successfully!', { variant: 'success' });
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        enqueueSnackbar('Please sign in first', { variant: 'warning' });
        router.push('/signin');
        return;
      }
      enqueueSnackbar(error instanceof ApiError ? error.message : 'Failed to create resume', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-gray-50 via-white to-indigo-50 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs font-mono text-gray-400 hover:text-blue-600 transition-colors">← dashboard()</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">
            <span className="font-mono text-indigo-600">{'<'}</span> Create Resume <span className="font-mono text-indigo-600">{'/>'}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-mono">// fill in the form below — add as many entries as you need</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Personal Info ── */}
          <section className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200/60 shadow-xl p-6 md:p-8">
            <h2 className="font-mono text-sm text-gray-400 mb-6">// 01. personalInfo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="title" value={personal.title} onChange={sp('title')} placeholder="e.g. My Main Resume" />
              <Input label="firstName" value={personal.firstName} onChange={sp('firstName')} />
              <Input label="middleName" value={personal.middleName} onChange={sp('middleName')} />
              <Input label="lastName" value={personal.lastName} onChange={sp('lastName')} />
              <Input label="resumeEmail" value={personal.resumeEmail} onChange={sp('resumeEmail')} type="email" />
              <Input label="phoneNumber" value={personal.phoneNumber} onChange={sp('phoneNumber')} />
              <Input label="country" value={personal.country} onChange={sp('country')} />
              <Input label="dateOfBirth" value={personal.dateOfBirth} onChange={sp('dateOfBirth')} type="date" />
              <Input label="yearOfGraduation" value={personal.yearOfGraduation} onChange={sp('yearOfGraduation')} placeholder="e.g. 2025" />
              <Input label="linkedIn" value={personal.linkedIn} onChange={sp('linkedIn')} placeholder="https://linkedin.com/in/..." />
              <Input label="github" value={personal.github} onChange={sp('github')} placeholder="https://github.com/..." />
              <Input label="personalPortfolio" value={personal.personalPortfolio} onChange={sp('personalPortfolio')} />
              <Input label="leetCode" value={personal.leetCode} onChange={sp('leetCode')} />
              <Input label="codingProfile2" value={personal.codingProfile2} onChange={sp('codingProfile2')} />
              <Input label="codingProfile3" value={personal.codingProfile3} onChange={sp('codingProfile3')} />
              <div className="sm:col-span-2">
                <Input label="address" value={personal.address} onChange={sp('address')} />
              </div>
            </div>
            <div className="mt-4">
              <Textarea label="summary" value={personal.summary} onChange={sp('summary')} placeholder="A short professional summary..." />
            </div>
          </section>

          {/* ── Education ── */}
          <section className={sectionCardCls}>
            <SectionHeader title="education" count={education.length} onAdd={() => setEducation(p => [...p, newEdu()])} />
            {education.map((edu, i) => (
              <ListItem key={i} index={i} onRemove={() => removeRow(setEducation, i)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="instituteName" value={edu.instituteName||''} onChange={v => updateRow(setEducation,i,'instituteName',v)} />
                  <Input label="level" value={edu.level||''} onChange={v => updateRow(setEducation,i,'level',v)} placeholder="e.g. Bachelor's" />
                  <Input label="degree" value={edu.degree||''} onChange={v => updateRow(setEducation,i,'degree',v)} />
                  <Input label="branch" value={edu.branch||''} onChange={v => updateRow(setEducation,i,'branch',v)} />
                  <Input label="startDate" value={edu.startDate||''} onChange={v => updateRow(setEducation,i,'startDate',v)} placeholder="e.g. Aug 2021" />
                  <Input label="endDate" value={edu.endDate||''} onChange={v => updateRow(setEducation,i,'endDate',v)} placeholder="e.g. May 2025" />
                  <Input label="location" value={edu.location||''} onChange={v => updateRow(setEducation,i,'location',v)} />
                  <Input label="grade" value={edu.grade||''} onChange={v => updateRow(setEducation,i,'grade',v)} placeholder="e.g. 9.1 CGPA" />
                </div>
              </ListItem>
            ))}
            {education.length === 0 && <p className="text-center font-mono text-xs text-gray-400 py-4">// no education entries yet</p>}
          </section>

          {/* ── Experience ── */}
          <section className={sectionCardCls}>
            <SectionHeader title="experience" count={experience.length} onAdd={() => setExperience(p => [...p, newExp()])} />
            {experience.map((exp, i) => (
              <ListItem key={i} index={i} onRemove={() => removeRow(setExperience, i)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="companyName" value={exp.companyName||''} onChange={v => updateRow(setExperience,i,'companyName',v)} />
                  <Input label="position" value={exp.position||''} onChange={v => updateRow(setExperience,i,'position',v)} />
                  <Input label="location" value={exp.location||''} onChange={v => updateRow(setExperience,i,'location',v)} />
                  <Field label="type">
                    <select className={inputCls} value={exp.type||'INTERNSHIP'} onChange={e => updateRow(setExperience,i,'type',e.target.value)}>
                      {EXP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Input label="startDate" value={exp.startDate||''} onChange={v => updateRow(setExperience,i,'startDate',v)} placeholder="e.g. Jun 2024" />
                  <Input label="endDate" value={exp.endDate||''} onChange={v => updateRow(setExperience,i,'endDate',v)} placeholder="e.g. Aug 2024 or present" />
                  <div className="sm:col-span-2">
                    <Input label="proofLink" value={exp.proofLink||''} onChange={v => updateRow(setExperience,i,'proofLink',v)} placeholder="https://..." />
                  </div>
                </div>
                <Textarea label="description" value={exp.description||''} onChange={v => updateRow(setExperience,i,'description',v)} placeholder="Describe your responsibilities..." />
              </ListItem>
            ))}
            {experience.length === 0 && <p className="text-center font-mono text-xs text-gray-400 py-4">// no experience entries yet</p>}
          </section>

          {/* ── Projects ── */}
          <section className={sectionCardCls}>
            <SectionHeader title="projects" count={projects.length} onAdd={() => setProjects(p => [...p, newProj()])} />
            {projects.map((proj, i) => (
              <ListItem key={i} index={i} onRemove={() => removeRow(setProjects, i)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="projectName" value={proj.projectName||''} onChange={v => updateRow(setProjects,i,'projectName',v)} />
                  <Input label="techStack (comma separated)" value={proj.techStack||''} onChange={v => updateRow(setProjects,i,'techStack',v)} placeholder="React, Node.js, PostgreSQL" />
                  <Input label="githubLink" value={proj.githubLink||''} onChange={v => updateRow(setProjects,i,'githubLink',v)} placeholder="https://github.com/..." />
                  <Input label="liveLink" value={proj.liveLink||''} onChange={v => updateRow(setProjects,i,'liveLink',v)} placeholder="https://..." />
                  <Input label="startDate" value={proj.startDate||''} onChange={v => updateRow(setProjects,i,'startDate',v)} />
                  <Input label="endDate" value={proj.endDate||''} onChange={v => updateRow(setProjects,i,'endDate',v)} />
                </div>
                <Textarea label="description" value={proj.description||''} onChange={v => updateRow(setProjects,i,'description',v)} placeholder="Describe what this project does..." />
              </ListItem>
            ))}
            {projects.length === 0 && <p className="text-center font-mono text-xs text-gray-400 py-4">// no project entries yet</p>}
          </section>

          {/* ── Skills ── */}
          <section className={sectionCardCls}>
            <SectionHeader title="skills" count={skills.length} onAdd={() => setSkills(p => [...p, newSkill()])} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.map((skill, i) => (
                <div key={i} className="border-2 border-gray-100 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-300">#{i+1}</span>
                    <button type="button" onClick={() => removeRow(setSkills, i)} className={removeBtnCls}>remove()</button>
                  </div>
                  <Input label="name" value={skill.name||''} onChange={v => updateRow(setSkills,i,'name',v)} placeholder="e.g. TypeScript" />
                  <Input label="category" value={skill.category||''} onChange={v => updateRow(setSkills,i,'category',v)} placeholder="e.g. Language" />
                </div>
              ))}
            </div>
            {skills.length === 0 && <p className="text-center font-mono text-xs text-gray-400 py-4">// no skill entries yet</p>}
          </section>

          {/* ── Achievements ── */}
          <section className={sectionCardCls}>
            <SectionHeader title="achievements" count={achievements.length} onAdd={() => setAchievements(p => [...p, newAch()])} />
            {achievements.map((ach, i) => (
              <ListItem key={i} index={i} onRemove={() => removeRow(setAchievements, i)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="title" value={ach.title||''} onChange={v => updateRow(setAchievements,i,'title',v)} />
                  <Input label="org" value={ach.org||''} onChange={v => updateRow(setAchievements,i,'org',v)} />
                  <div className="sm:col-span-2">
                    <Input label="date" value={ach.date||''} onChange={v => updateRow(setAchievements,i,'date',v)} placeholder="e.g. March 2024" />
                  </div>
                </div>
                <Textarea label="description" value={ach.description||''} onChange={v => updateRow(setAchievements,i,'description',v)} />
              </ListItem>
            ))}
            {achievements.length === 0 && <p className="text-center font-mono text-xs text-gray-400 py-4">// no achievement entries yet</p>}
          </section>

          {/* ── Positions of Responsibility ── */}
          <section className={sectionCardCls}>
            <SectionHeader title="positionsOfResponsibility" count={pors.length} onAdd={() => setPors(p => [...p, newPor()])} />
            {pors.map((por, i) => (
              <ListItem key={i} index={i} onRemove={() => removeRow(setPors, i)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="title" value={por.title||''} onChange={v => updateRow(setPors,i,'title',v)} />
                  <Input label="org" value={por.org||''} onChange={v => updateRow(setPors,i,'org',v)} />
                  <Input label="startDate" value={por.startDate||''} onChange={v => updateRow(setPors,i,'startDate',v)} />
                  <Input label="endDate" value={por.endDate||''} onChange={v => updateRow(setPors,i,'endDate',v)} />
                </div>
                <Textarea label="description" value={por.description||''} onChange={v => updateRow(setPors,i,'description',v)} />
              </ListItem>
            ))}
            {pors.length === 0 && <p className="text-center font-mono text-xs text-gray-400 py-4">// no POR entries yet</p>}
          </section>

          {/* ── Publications ── */}
          <section className={sectionCardCls}>
            <SectionHeader title="publications" count={publications.length} onAdd={() => setPublications(p => [...p, newPub()])} />
            {publications.map((pub, i) => (
              <ListItem key={i} index={i} onRemove={() => removeRow(setPublications, i)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="title" value={pub.title||''} onChange={v => updateRow(setPublications,i,'title',v)} />
                  <Input label="authors" value={pub.authors||''} onChange={v => updateRow(setPublications,i,'authors',v)} />
                  <Input label="conference" value={pub.conference||''} onChange={v => updateRow(setPublications,i,'conference',v)} />
                  <Input label="place" value={pub.place||''} onChange={v => updateRow(setPublications,i,'place',v)} />
                  <div className="sm:col-span-2">
                    <Input label="publicationDate" value={pub.publicationDate||''} onChange={v => updateRow(setPublications,i,'publicationDate',v)} placeholder="e.g. January 2024" />
                  </div>
                </div>
                <Textarea label="description" value={pub.description||''} onChange={v => updateRow(setPublications,i,'description',v)} />
              </ListItem>
            ))}
            {publications.length === 0 && <p className="text-center font-mono text-xs text-gray-400 py-4">// no publication entries yet</p>}
          </section>

          {/* ── Submit ── */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-black text-white rounded-lg hover:bg-indigo-600 transition-all font-mono text-sm shadow-lg hover:shadow-indigo-500/40 border-2 border-black hover:border-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'creating...' : 'createResume()'}
            </button>
            <Link href="/dashboard" className="px-6 py-3 bg-white text-gray-900 rounded-lg hover:text-red-600 transition-all font-mono text-sm border-2 border-gray-300 hover:border-red-400">
              cancel()
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
