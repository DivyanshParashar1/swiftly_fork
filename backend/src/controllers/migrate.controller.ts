import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiError } from '../utils/apiError.utils';
import { ApiResponse } from '../utils/apiResponse.utils';
import { ResumeService } from '../services/resume.service';
import { listTemplates, migrateResumeToPdf } from '../services/migrate.service';
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
 * POST /api/v1/migrate/compile
 * Body: { resumeId: string, templateId: string }
 *
 * Fetches resume from DB, renders it into the chosen LaTeX template,
 * sends to latex-service, streams the PDF back to the browser.
 */
export const compileMigratedResume = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { resumeId, templateId } = req.body as { resumeId?: string; templateId?: string };

  if (!resumeId) throw new ApiError(400, 'resumeId is required');
  if (!templateId) throw new ApiError(400, 'templateId is required');

  // Fetch the full resume record (with all related tables)
  const records = await resumeService.fetchOneFullResumeForUser(userId, resumeId);
  const resume = Array.isArray(records) ? records[0] : records;

  if (!resume) {
    throw new ApiError(404, 'Resume not found or does not belong to this user');
  }

  const pdfBuffer = await migrateResumeToPdf(resume as any, templateId);

  const fileName = `resume-${templateId}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.send(pdfBuffer);
});
