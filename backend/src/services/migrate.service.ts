import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { ApiError } from '../utils/apiError.utils';
import type {
  EducationTable,
  ExperienceTable,
  ProjectsTable,
  SkillsTable,
  AchievementsTable,
  PorTable,
  PublicationsTable,
} from '../types/db.types';

// Resolve config dir relative to this file — works regardless of CWD
const CONFIG_DIR = path.resolve(import.meta.dirname, '../config');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResumeDetailRecord {
  id: string;
  userId: string;
  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  country?: string | null;
  phoneNumber?: string | null;
  resumeEmail?: string | null;
  dateOfBirth?: string | null;
  linkedIn?: string | null;
  github?: string | null;
  personalPortfolio?: string | null;
  leetCode?: string | null;
  codingProfile2?: string | null;
  codingProfile3?: string | null;
  summary?: string | null;
  address?: string | null;
  yearOfGraduation?: number | null;
  education: (EducationTable & { id: string; resumeId: string })[];
  experience: (ExperienceTable & { id: string; resumeId: string })[];
  projects: (ProjectsTable & { id: string; resumeId: string })[];
  skills: (SkillsTable & { id: string; resumeId: string })[];
  achievements: (AchievementsTable & { id: string; resumeId: string })[];
  pors: (PorTable & { id: string; resumeId: string })[];
  publications: (PublicationsTable & { id: string; resumeId: string })[];
}

// ─── Template registry ───────────────────────────────────────────────────────

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  file: string;
  thumbnail: string | null;
}

interface TemplatesJson {
  templates: TemplateConfig[];
}

function loadTemplatesJson(): TemplatesJson {
  const templatesJsonPath = path.join(CONFIG_DIR, 'templates.json');
  try {
    const raw = fs.readFileSync(templatesJsonPath, 'utf-8');
    return JSON.parse(raw) as TemplatesJson;
  } catch (err) {
    throw new ApiError(500, `Failed to load template registry: ${String(err)}`);
  }
}

export function listTemplates() {
  const { templates } = loadTemplatesJson();
  return templates.map(({ id, name, description, thumbnail }) => ({
    id,
    name,
    description,
    thumbnail,
  }));
}

export function getTemplateById(templateId: string): TemplateConfig {
  const { templates } = loadTemplatesJson();
  const tpl = templates.find((t) => t.id === templateId);
  if (!tpl) {
    throw new ApiError(404, `Template "${templateId}" not found`);
  }
  return tpl;
}

// ─── Data transformation ─────────────────────────────────────────────────────

function groupSkills(skills: ResumeDetailRecord['skills']) {
  const map = new Map<string, string[]>();
  for (const s of skills) {
    const cat = s.category || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(s.name || '');
  }
  return Array.from(map.entries()).map(([category, names]) => ({
    category,
    skills: names.join(', '),
  }));
}

/**
 * Escape LaTeX special characters from user-supplied strings.
 * Prevents injection / compilation errors.
 */
function escapeLaTeX(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

function escapeObject(obj: unknown): unknown {
  if (typeof obj === 'string') return escapeLaTeX(obj);
  if (Array.isArray(obj)) return obj.map(escapeObject);
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = escapeObject(v);
    }
    return out;
  }
  return obj;
}

function buildTemplateContext(resume: ResumeDetailRecord): Record<string, unknown> {
  const raw = {
    firstName: resume.firstName,
    middleName: resume.middleName,
    lastName: resume.lastName,
    resumeEmail: resume.resumeEmail,
    phoneNumber: resume.phoneNumber,
    country: resume.country,
    linkedIn: resume.linkedIn,
    github: resume.github,
    personalPortfolio: resume.personalPortfolio,
    leetCode: resume.leetCode,
    codingProfile2: resume.codingProfile2,
    codingProfile3: resume.codingProfile3,
    summary: resume.summary,
    address: resume.address,

    education: resume.education || [],
    experience: resume.experience || [],
    projects: (resume.projects || []).map((p) => ({
      ...p,
      techStackStr: (p.techStack || []).join(', '),
    })),
    skills: resume.skills || [],
    achievements: resume.achievements || [],
    pors: resume.pors || [],
    publications: resume.publications || [],
    skillCategories: groupSkills(resume.skills || []),
  };

  return escapeObject(raw) as Record<string, unknown>;
}

// ─── Core compilation ────────────────────────────────────────────────────────

export async function migrateResumeToPdf(
  resume: ResumeDetailRecord,
  templateId: string
): Promise<Buffer> {
  const template = getTemplateById(templateId);

  // template.file is stored as "src/config/templates/classic.tex"
  // resolve it from the repo root (CONFIG_DIR/../..)
  const texTemplatePath = path.join(CONFIG_DIR, 'templates', `${templateId}.tex`);

  let texSource: string;
  try {
    texSource = fs.readFileSync(texTemplatePath, 'utf-8');
  } catch {
    throw new ApiError(500, `Could not read template file for "${templateId}" at ${texTemplatePath}`);
  }

  // Compile and render via Handlebars
  let rendered: string;
  try {
    const compiledTemplate = Handlebars.compile(texSource, { noEscape: true });
    const context = buildTemplateContext(resume);
    rendered = compiledTemplate(context);
  } catch (err) {
    throw new ApiError(500, `Template rendering error: ${String(err)}`);
  }

  // POST to latex-service
  const latexServiceUrl = (process.env.LATEX_SERVICE_URL || 'http://localhost:4000').replace(/\/$/, '');
  const endpoint = `${latexServiceUrl}/compile`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex: rendered }),
      // @ts-ignore — signal not in all TS lib versions
      signal: AbortSignal.timeout(90_000), // 90s max wait
    });
  } catch (err) {
    throw new ApiError(
      503,
      `latex-service unreachable at ${endpoint}. Is it running? Error: ${String(err)}`
    );
  }

  if (!response.ok) {
    let details = 'Unknown compilation error';
    try {
      const errBody = (await response.json()) as { error?: string; details?: string };
      details = errBody.details || errBody.error || details;
    } catch {
      details = (await response.text()).slice(0, 500);
    }
    throw new ApiError(422, `LaTeX compilation failed:\n${details}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
