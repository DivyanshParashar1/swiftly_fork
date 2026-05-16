import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import Handlebars from 'handlebars';
import prisma from '../config/prisma';
import { ApiError } from '../utils/apiError.utils';

const execFileAsync = promisify(execFile);

// ── Handlebars helpers ──────────────────────────────────────────────────────

// Joins an array with ", " — used for tech stacks and skill lists
Handlebars.registerHelper('joinComma', (arr: string[]) => {
    if (!Array.isArray(arr)) return '';
    return arr.join(', ');
});

// ── LaTeX escaping ──────────────────────────────────────────────────────────

const LATEX_ESCAPE_MAP: Record<string, string> = {
    '&': '\\&',
    '%': '\\%',
    '$': '\\$',
    '#': '\\#',
    '_': '\\_',
    '{': '\\{',
    '}': '\\}',
    '~': '\\textasciitilde{}',
    '^': '\\textasciicircum{}',
    '\\': '\\textbackslash{}',
};

function escapeLatex(str: string | null | undefined): string {
    if (!str) return '';
    return str.replace(/[&%$#_{}~^\\]/g, (char) => LATEX_ESCAPE_MAP[char] ?? char);
}

// ── Data shape expected by the template ─────────────────────────────────────

interface SkillCategory {
    category: string;
    skills: string[];
}

interface TemplateContext {
    name: string;
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    github: string | null;
    website: string | null;
    summary: string | null;
    education: {
        instituteName: string;
        degree: string;
        field: string | null;
        startDate: string | null;
        endDate: string | null;
        location: string | null;
        gpa: string | null;
    }[];
    experience: {
        company: string;
        role: string;
        location: string | null;
        startDate: string | null;
        endDate: string | null;
        bullets: string[];
    }[];
    projects: {
        name: string;
        description: string | null;
        tech_stack: string[];
        link: string | null;
    }[];
    skillCategories: SkillCategory[];
    certifications: {
        name: string;
        issuer: string | null;
        date: string | null;
    }[];
    custom_sections: {
        title: string;
        content: string;
    }[];
}

// ── Convert Prisma resume record → template context ─────────────────────────

function buildTemplateContext(resume: Awaited<ReturnType<typeof prisma.resume.findFirst>> & {
    education: any[];
    experience: any[];
    projects: any[];
    skills: any[];
    achievements: any[];
    pors: any[];
    publications: any[];
}): TemplateContext {
    if (!resume) throw new ApiError(404, 'Resume not found');

    const fullName = [resume.firstName, resume.middleName, resume.lastName]
        .filter(Boolean)
        .map(escapeLatex)
        .join(' ') || escapeLatex(resume.title) || 'Your Name';

    // ── Skills → grouped by category ──────────────────────────────────────
    const categoryMap = new Map<string, string[]>();
    for (const skill of resume.skills) {
        const cat = escapeLatex(skill.category) || 'Other';
        const name = escapeLatex(skill.name);
        if (!name) continue;
        if (!categoryMap.has(cat)) categoryMap.set(cat, []);
        categoryMap.get(cat)!.push(name);
    }
    const skillCategories: SkillCategory[] = Array.from(categoryMap.entries()).map(
        ([category, skills]) => ({ category, skills })
    );

    // ── Achievements → custom_sections ────────────────────────────────────
    const custom_sections: { title: string; content: string }[] = [];

    if (resume.achievements.length > 0) {
        const lines = resume.achievements
            .map((a: any) => {
                const parts = [escapeLatex(a.title), escapeLatex(a.org), escapeLatex(a.date)]
                    .filter(Boolean)
                    .join(' | ');
                return `\\item ${parts}${a.description ? ` --- ${escapeLatex(a.description)}` : ''}`;
            })
            .join('\n    ');
        custom_sections.push({
            title: 'Achievements',
            content: `\\begin{itemize}[leftmargin=0.15in, label=\\textbullet]\n    ${lines}\n\\end{itemize}`,
        });
    }

    if (resume.pors.length > 0) {
        const lines = resume.pors
            .map((p: any) => {
                const parts = [escapeLatex(p.title), escapeLatex(p.org)].filter(Boolean).join(' | ');
                const dates = [p.startDate, p.endDate].filter(Boolean).map(escapeLatex).join(' -- ');
                return `\\item \\textbf{${parts}}${dates ? ` (${dates})` : ''}${p.description ? ` --- ${escapeLatex(p.description)}` : ''}`;
            })
            .join('\n    ');
        custom_sections.push({
            title: 'Positions of Responsibility',
            content: `\\begin{itemize}[leftmargin=0.15in, label=\\textbullet]\n    ${lines}\n\\end{itemize}`,
        });
    }

    if (resume.publications.length > 0) {
        const lines = resume.publications
            .map((p: any) => {
                const parts = [
                    escapeLatex(p.title),
                    escapeLatex(p.authors),
                    escapeLatex(p.conference),
                    escapeLatex(p.place),
                    escapeLatex(p.publicationDate),
                ]
                    .filter(Boolean)
                    .join(' | ');
                return `\\item ${parts}`;
            })
            .join('\n    ');
        custom_sections.push({
            title: 'Publications',
            content: `\\begin{itemize}[leftmargin=0.15in, label=\\textbullet]\n    ${lines}\n\\end{itemize}`,
        });
    }

    return {
        name: fullName,
        email: escapeLatex(resume.resumeEmail) || null,
        phone: escapeLatex(resume.phoneNumber) || null,
        linkedin: resume.linkedIn || null, // URLs go raw into href — not escaped
        github: resume.github || null,
        website: resume.personalPortfolio || null,
        summary: escapeLatex(resume.summary) || null,

        education: resume.education.map((e: any) => ({
            instituteName: escapeLatex(e.instituteName) || '',
            degree: escapeLatex(e.degree) || '',
            field: escapeLatex(e.branch) || null,
            startDate: escapeLatex(e.startDate) || null,
            endDate: escapeLatex(e.endDate) || null,
            location: escapeLatex(e.location) || null,
            gpa: escapeLatex(e.grade) || null,
        })),

        experience: resume.experience.map((e: any) => {
            const raw = e.description ?? '';
            // Split description into bullet points. If it already has newlines, split on them;
            // otherwise treat the whole description as a single bullet.
            const bullets = raw
                .split(/[\n\r]+/)
                .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
                .filter(Boolean)
                .map(escapeLatex);
            return {
                company: escapeLatex(e.companyName) || '',
                role: escapeLatex(e.position) || '',
                location: escapeLatex(e.location) || null,
                startDate: escapeLatex(e.startDate) || null,
                endDate: escapeLatex(e.endDate) || null,
                bullets,
            };
        }),

        projects: resume.projects.map((p: any) => ({
            name: escapeLatex(p.projectName) || '',
            description: escapeLatex(p.description) || null,
            tech_stack: (p.techStack ?? []).map(escapeLatex),
            link: p.githubLink || p.liveLink || null,
        })),

        skillCategories,
        certifications: [], // No certifications table in schema yet — kept for template completeness
        custom_sections,
    };
}

// ── Main export service class ────────────────────────────────────────────────

export class LatexExportService {
    private readonly templatePath = path.join(
        import.meta.dir ?? __dirname,
        '../templates/resume.tex'
    );

    /** Compile resume → PDF and return Buffer */
    public async exportToPdf(userId: string, resumeId: string): Promise<Buffer> {
        // 1. Fetch resume with all relations
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId },
            include: {
                education: true,
                experience: true,
                projects: true,
                skills: true,
                achievements: true,
                pors: true,
                publications: true,
            },
        });

        if (!resume) {
            throw new ApiError(404, 'Resume not found or does not belong to you');
        }

        // 2. Build template context from Prisma data
        const context = buildTemplateContext(resume as any);

        // 3. Render Handlebars template
        const templateSrc = await fs.promises.readFile(this.templatePath, 'utf-8');
        const compiledTemplate = Handlebars.compile(templateSrc, { noEscape: true });
        const latexSource = compiledTemplate(context);

        // 4. Send to LaTeX Online API
        try {
            const response = await fetch('https://latex.ytotech.com/builds/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    compiler: 'pdflatex',
                    resources: [
                        {
                            main: true,
                            content: latexSource,
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('LaTeX Compile Error:', errorText);
                throw new ApiError(500, 'LaTeX compilation via API failed. Please try again later.');
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            if (error instanceof ApiError) throw error;
            console.error('LaTeX API Request Failed:', error);
            throw new ApiError(500, 'Failed to connect to LaTeX compilation service.');
        }
    }
}
