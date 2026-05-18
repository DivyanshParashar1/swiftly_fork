import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiError } from '../utils/apiError.utils';
import { ApiResponse } from '../utils/apiResponse.utils';
import { ResumeService } from '../services/resume.service';
import {
  listTemplates,
  migrateResumeToPdf,
  getRenderedLatex,
  loadTemplateMeta,
  loadTemplateSchema,
  type MigrationConfig,
} from '../services/migrate.service';
import type { AuthRequest } from '../types/auth.types';

const resumeService = new ResumeService();

/**
 * GET /api/v1/migrate/templates
 * Returns the list of available LaTeX templates.
 */
export const getTemplates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const templates = listTemplates();
  return res.status(200).json(new ApiResponse(200, templates, 'Templates fetched successfully'));
});

/**
 * GET /api/v1/migrate/meta/:templateId
 * Returns template.meta.json for a given template (defaultSectionOrder, requiredUserInputs, etc.)
 */
export const getTemplateMeta = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { templateId } = req.params as { templateId: string };
  const meta = loadTemplateMeta(templateId);
  if (!meta) throw new ApiError(404, `No metadata found for template "${templateId}"`);
  return res.status(200).json(new ApiResponse(200, meta, 'Template meta fetched'));
});

/**
 * GET /api/v1/migrate/schema/:templateId
 * Returns mapToDbSchema.json for a given template — drives USER_INPUT form generation.
 */
export const getTemplateSchema = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { templateId } = req.params as { templateId: string };
  const schema = loadTemplateSchema(templateId);
  if (!schema) throw new ApiError(404, `No schema found for template "${templateId}"`);
  return res.status(200).json(new ApiResponse(200, schema, 'Template schema fetched'));
});

/**
 * POST /api/v1/migrate/compile
 * Body: { resumeId: string, templateId: string, migrationConfig?: MigrationConfig }
 *
 * Fetches resume from DB, renders it into the chosen LaTeX template,
 * sends to latex-service, streams the PDF back to the browser.
 */
export const compileMigratedResume = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { resumeId, templateId, migrationConfig } = req.body as {
    resumeId?: string;
    templateId?: string;
    migrationConfig?: MigrationConfig;
  };

  if (!resumeId) throw new ApiError(400, 'resumeId is required');
  if (!templateId) throw new ApiError(400, 'templateId is required');

  const records = await resumeService.fetchOneFullResumeForUser(userId, resumeId);
  const resume = Array.isArray(records) ? records[0] : records;

  if (!resume) throw new ApiError(404, 'Resume not found or does not belong to this user');

  const pdfBuffer = await migrateResumeToPdf(resume as any, templateId, migrationConfig);

  const fileName = `resume-${templateId}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.send(pdfBuffer);
});

/**
 * POST /api/v1/migrate/latex
 * Body: { resumeId: string, templateId: string, migrationConfig?: MigrationConfig }
 *
 * Returns the fully rendered .tex source (Handlebars resolved, sections assembled).
 * Used for direct .tex download from the frontend.
 */
export const getLatexSource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { resumeId, templateId, migrationConfig } = req.body as {
    resumeId?: string;
    templateId?: string;
    migrationConfig?: MigrationConfig;
  };

  if (!resumeId) throw new ApiError(400, 'resumeId is required');
  if (!templateId) throw new ApiError(400, 'templateId is required');

  const records = await resumeService.fetchOneFullResumeForUser(userId, resumeId);
  const resume = Array.isArray(records) ? records[0] : records;

  if (!resume) throw new ApiError(404, 'Resume not found or does not belong to this user');

  const rendered = getRenderedLatex(resume as any, templateId, migrationConfig);

  res.setHeader('Content-Type', 'application/x-tex');
  res.setHeader('Content-Disposition', `attachment; filename="resume-${templateId}.tex"`);
  res.send(rendered);
});
