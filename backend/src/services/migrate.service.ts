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

// ─── Shared Types ─────────────────────────────────────────────────────────────

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

/** A single section's migration config — mirrors the frontend MigrationSection type. */
export interface MigrationSection {
  key: string;       // e.g. 'experience'
  visible: boolean;
  itemOrder: string[];    // ordered item IDs (currently informational; filtering uses hiddenItems)
  hiddenItems: string[];  // item IDs to exclude from rendering
}

/** Full payload sent from the frontend to drive compilation. */
export interface MigrationConfig {
  sections: MigrationSection[];
  userInputs: Record<string, string>;  // extra fields like roll, course, collegeEmail
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

export interface TemplateMeta {
  id: string;
  supportsSectionReordering: boolean;
  supportsItemVisibility: boolean;
  requiredUserInputs: string[];
  defaultSectionOrder: string[];
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

/** Returns the directory path for a modular template (one that has index.tex + section-modules/). */
function getTemplateDirPath(templateId: string): string | null {
  const dirPath = path.join(CONFIG_DIR, 'templates', templateId);
  return fs.existsSync(dirPath) ? dirPath : null;
}

/** Load template.meta.json for a given template ID. Returns null if not present. */
export function loadTemplateMeta(templateId: string): TemplateMeta | null {
  const dirPath = getTemplateDirPath(templateId);
  if (!dirPath) return null;
  const metaPath = path.join(dirPath, 'template.meta.json');
  try {
    const raw = fs.readFileSync(metaPath, 'utf-8');
    return JSON.parse(raw) as TemplateMeta;
  } catch {
    return null;
  }
}

/** Load mapToDbSchema.json for a given template ID. Returns null if not present. */
export function loadTemplateSchema(templateId: string): Record<string, unknown> | null {
  const dirPath = getTemplateDirPath(templateId);
  if (!dirPath) return null;
  const schemaPath = path.join(dirPath, 'mapToDbSchema.json');
  try {
    const raw = fs.readFileSync(schemaPath, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Section key → file name mapping ─────────────────────────────────────────

const SECTION_FILE_MAP: Record<string, string> = {
  summary: 'summary',
  education: 'education',
  experience: 'experience',
  projects: 'projects',
  skills: 'skills',
  achievements: 'achievements',
  por: 'por',
  publications: 'publications',
};

// ─── LaTeX escape helpers ─────────────────────────────────────────────────────

/** Keys whose values are URLs — must NOT be LaTeX-escaped (they go inside \href{}). */
const URL_KEYS = new Set([
  'linkedIn', 'github', 'personalPortfolio', 'leetCode',
  'codingProfile2', 'codingProfile3', 'resumeEmail',
  'linkedInDisplay', 'githubDisplay', 'portfolioDisplay',
  'proofLink', 'githubLink', 'liveLink',
]);

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
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/–/g, '--')    // Unicode en dash → LaTeX --
    .replace(/—/g, '---');  // Unicode em dash → LaTeX ---
}

function escapeObject(obj: unknown): unknown {
  if (typeof obj === 'string') return escapeLaTeX(obj);
  if (Array.isArray(obj)) return obj.map(escapeObject);
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      // Don't escape URL fields — they go inside \href{} which needs raw URLs
      if (URL_KEYS.has(k)) {
        out[k] = v;
      } else {
        out[k] = escapeObject(v);
      }
    }
    return out;
  }
  return obj;
}

// ─── Date formatting ──────────────────────────────────────────────────────────

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_FULL_NAMES: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

/** Keys that hold date values — format them from ISO to "Mon YYYY". */
const DATE_KEYS = new Set([
  'startDate', 'endDate', 'date', 'publicationDate',
]);

/**
 * Convert a date string to "Mon YYYY" (e.g. "Aug 2023").
 * Handles: ISO (2023-08-01), full month name (August 2023), abbrev (Aug 2023).
 * Normalizes "present"/"current"/"now" → "Present".
 * Passes through year-only strings (e.g. "2025") unchanged.
 */
function formatDate(val: string | null | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();

  // Normalize "Present" variants
  const lc = trimmed.toLowerCase();
  if (lc === 'present' || lc === 'current' || lc === 'now' || lc === 'ongoing') {
    return 'Present';
  }

  // ISO format: YYYY-MM or YYYY-MM-DD → "Mon YYYY"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (isoMatch) {
    const year = isoMatch[1]!;
    const monthIdx = parseInt(isoMatch[2]!, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_ABBR[monthIdx]} ${year}`;
    }
  }

  // Full month name: "January 2023" → "Jan 2023"
  const fullMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (fullMatch) {
    const idx = MONTH_FULL_NAMES[fullMatch[1]!.toLowerCase()];
    if (idx !== undefined) {
      return `${MONTH_ABBR[idx]} ${fullMatch[2]}`;
    }
  }

  return trimmed; // year-only ("2025"), already formatted ("Aug 2023"), etc.
}

/** Recursively format date fields in an object tree. */
function formatDates(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(formatDates);
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (DATE_KEYS.has(k) && typeof v === 'string') {
        out[k] = formatDate(v);
      } else {
        out[k] = formatDates(v);
      }
    }
    return out;
  }
  return obj;
}

// ─── Context Builder (pure data, no ordering logic) ──────────────────────────

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
 * Builds a normalized template context from DB data + migration config.
 * Responsibilities: filtering hidden items, preprocessing arrays (techStack → techStackStr).
 * Does NOT handle section ordering — that belongs to LatexAssembler.
 */
function buildTemplateContext(
  resume: ResumeDetailRecord,
  sections: MigrationSection[]
): Record<string, unknown> {
  const sectionMap = new Map(sections.map((s) => [s.key, s]));

  function filterItems<T extends { id: string }>(arr: T[], sectionKey: string): T[] {
    const s = sectionMap.get(sectionKey);
    if (!s || !s.visible) return [];
    return arr.filter((item) => !s.hiddenItems.includes(item.id));
  }

  const filteredEducation = filterItems(resume.education || [], 'education');
  const filteredExperience = filterItems(resume.experience || [], 'experience');
  const rawProjects = filterItems(resume.projects || [], 'projects');
  const filteredSkills = filterItems(resume.skills || [], 'skills');
  const filteredAchievements = filterItems(resume.achievements || [], 'achievements');
  const filteredPors = filterItems(resume.pors || [], 'por');
  const filteredPublications = filterItems(resume.publications || [], 'publications');

  const summarySec = sectionMap.get('summary');
  const summary = summarySec?.visible !== false ? (resume.summary ?? null) : null;

  const filteredProjects = rawProjects.map((p) => ({
    ...p,
    techStackStr: (p.techStack || []).join(', '),
  }));

  /** Strip protocol + trailing slash from a URL for display in templates. */
  function stripUrl(url: string | null | undefined): string {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  return {
    // Personal info
    firstName: resume.firstName,
    middleName: resume.middleName,
    lastName: resume.lastName,
    resumeEmail: resume.resumeEmail,
    phoneNumber: resume.phoneNumber,
    country: resume.country,
    linkedIn: resume.linkedIn,
    github: resume.github,
    personalPortfolio: resume.personalPortfolio,
    linkedInDisplay: stripUrl(resume.linkedIn),
    githubDisplay: stripUrl(resume.github),
    portfolioDisplay: stripUrl(resume.personalPortfolio),
    leetCode: resume.leetCode,
    codingProfile2: resume.codingProfile2,
    codingProfile3: resume.codingProfile3,
    summary,
    address: resume.address,

    // Filtered + preprocessed sections
    education: filteredEducation,
    experience: filteredExperience,
    projects: filteredProjects,
    skills: filteredSkills,
    achievements: filteredAchievements,
    pors: filteredPors,
    publications: filteredPublications,
    skillCategories: groupSkills(filteredSkills),
    skillsFlat: filteredSkills.map((s) => s.name || '').filter(Boolean).join(', '),
  };
}

// ─── Template Adapters ────────────────────────────────────────────────────────

/**
 * Adapter for jakes-resume.
 * Merges userInputs into the base context (none expected for jakes, but kept consistent).
 */
function adaptToJakesResume(
  resume: ResumeDetailRecord,
  sections: MigrationSection[],
  userInputs: Record<string, string>
): Record<string, unknown> {
  const base = buildTemplateContext(resume, sections);
  return { ...base, ...userInputs };
}

/**
 * Adapter for rgipt-template.
 * Merges userInputs (roll, course, collegeEmail) into root context.
 */
function adaptToRgiptTemplate(
  resume: ResumeDetailRecord,
  sections: MigrationSection[],
  userInputs: Record<string, string>
): Record<string, unknown> {
  const base = buildTemplateContext(resume, sections);
  return { ...base, ...userInputs };
}

/** Dispatch to the correct template adapter by templateId. */
function adaptContext(
  resume: ResumeDetailRecord,
  sections: MigrationSection[],
  userInputs: Record<string, string>,
  templateId: string
): Record<string, unknown> {
  switch (templateId) {
    case 'jakes-resume':
      return adaptToJakesResume(resume, sections, userInputs);
    case 'rgipt-template':
      return adaptToRgiptTemplate(resume, sections, userInputs);
    default:
      // Generic fallback: merge userInputs into base context
      return { ...buildTemplateContext(resume, sections), ...userInputs };
  }
}

// ─── LaTeX Assembler ─────────────────────────────────────────────────────────

/**
 * Assembles a complete .tex string from a modular template directory.
 *
 * Flow:
 *   1. Read index.tex, split at '% SECTIONS_START' → preamble
 *   2. For each visible section (in the user's chosen order), read + append section-modules/<key>.tex
 *   3. Append \end{document}
 *   4. Compile the assembled string through Handlebars with the rendered context
 */
function assembleLaTeX(
  templateId: string,
  sections: MigrationSection[],
  context: Record<string, unknown>
): string {
  const templateDir = path.join(CONFIG_DIR, 'templates', templateId);
  const indexTexPath = path.join(templateDir, 'index.tex');

  let indexContent: string;
  try {
    indexContent = fs.readFileSync(indexTexPath, 'utf-8');
  } catch {
    throw new ApiError(500, `Could not read index.tex for template "${templateId}" at ${indexTexPath}`);
  }

  // Split at the SECTIONS_START marker
  const markerIdx = indexContent.indexOf('% SECTIONS_START');
  let preamble: string;

  if (markerIdx !== -1) {
    preamble = indexContent.slice(0, markerIdx).trimEnd();
  } else {
    // Fallback: find first \input{ and split there
    const inputIdx = indexContent.indexOf('\\input{');
    if (inputIdx !== -1) {
      preamble = indexContent.slice(0, inputIdx).trimEnd();
    } else {
      // No sections at all — compile the whole file as-is (flat template)
      return Handlebars.compile(indexContent, { noEscape: true })(context);
    }
  }

  // Build body by iterating visible sections in the user-defined order
  const sectionModulesDir = path.join(templateDir, 'section-modules');
  let body = '';

  for (const section of sections) {
    if (!section.visible) continue;
    const fileName = SECTION_FILE_MAP[section.key];
    if (!fileName) continue;

    const sectionPath = path.join(sectionModulesDir, `${fileName}.tex`);
    try {
      const sectionContent = fs.readFileSync(sectionPath, 'utf-8');
      body += '\n' + sectionContent.trimEnd() + '\n';
    } catch {
      // Section file doesn't exist for this template — skip silently
    }
  }

  const fullTex = `${preamble}\n${body}\n\\end{document}`;

  // Compile the assembled string through Handlebars
  try {
    const compiled = Handlebars.compile(fullTex, { noEscape: true });
    return compiled(context);
  } catch (err) {
    throw new ApiError(500, `Template rendering error: ${String(err)}`);
  }
}

// ─── Flat template assembler (legacy classic/modern) ─────────────────────────

function assembleFlatTemplate(
  texTemplatePath: string,
  context: Record<string, unknown>
): string {
  let texSource: string;
  try {
    texSource = fs.readFileSync(texTemplatePath, 'utf-8');
  } catch {
    throw new ApiError(500, `Could not read template file at ${texTemplatePath}`);
  }
  try {
    return Handlebars.compile(texSource, { noEscape: true })(context);
  } catch (err) {
    throw new ApiError(500, `Template rendering error: ${String(err)}`);
  }
}

// ─── Default migration config (used when none provided) ──────────────────────

const ALL_SECTION_KEYS = Object.keys(SECTION_FILE_MAP);

function buildDefaultMigrationConfig(
  resume: ResumeDetailRecord,
  templateId: string
): MigrationConfig {
  const meta = loadTemplateMeta(templateId);
  const sectionKeys = meta?.defaultSectionOrder ?? ALL_SECTION_KEYS;

  const sections: MigrationSection[] = sectionKeys.map((key) => ({
    key,
    visible: true,
    itemOrder: [],
    hiddenItems: [],
  }));

  return { sections, userInputs: {} };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the fully rendered .tex string for a resume + template combination.
 * Can be used for both PDF compilation and direct .tex download.
 */
export function getRenderedLatex(
  resume: ResumeDetailRecord,
  templateId: string,
  migrationConfig?: MigrationConfig
): string {
  const config = migrationConfig ?? buildDefaultMigrationConfig(resume, templateId);

  const templateDirPath = getTemplateDirPath(templateId);

  if (templateDirPath) {
    // Modular template (directory-based)
    const rawContext = adaptContext(resume, config.sections, config.userInputs, templateId);
    const escapedContext = escapeObject(rawContext) as Record<string, unknown>;
    const formattedContext = formatDates(escapedContext) as Record<string, unknown>;
    return assembleLaTeX(templateId, config.sections, formattedContext);
  } else {
    // Flat legacy template (classic, modern, etc.)
    const template = getTemplateById(templateId);
    const texTemplatePath = path.join(CONFIG_DIR, 'templates', `${templateId}.tex`);
    const rawContext = buildTemplateContext(resume, config.sections);
    const mergedContext = { ...rawContext, ...config.userInputs };
    const escapedContext = escapeObject(mergedContext) as Record<string, unknown>;
    const formattedContext = formatDates(escapedContext) as Record<string, unknown>;
    return assembleFlatTemplate(texTemplatePath, formattedContext);
  }
}

/**
 * Compiles a resume to PDF via the latex-service.
 * Accepts an optional migrationConfig — falls back to default section order if absent.
 */
export async function migrateResumeToPdf(
  resume: ResumeDetailRecord,
  templateId: string,
  migrationConfig?: MigrationConfig
): Promise<Buffer> {
  const rendered = getRenderedLatex(resume, templateId, migrationConfig);

  const latexServiceUrl = (process.env.LATEX_SERVICE_URL || 'http://localhost:4000').replace(/\/$/, '');
  const endpoint = `${latexServiceUrl}/compile`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex: rendered }),
      // @ts-ignore — signal not in all TS lib versions
      signal: AbortSignal.timeout(90_000),
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
      const rawText = await response.text();
      try {
        const errBody = JSON.parse(rawText) as { error?: string; details?: string };
        details = errBody.details || errBody.error || details;
      } catch {
        details = rawText.slice(0, 500);
      }
    } catch { /* body read failed */ }
    throw new ApiError(422, `LaTeX compilation failed:\n${details}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
