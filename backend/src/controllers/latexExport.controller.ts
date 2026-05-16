import type { Response } from 'express';
import type { AuthRequest } from '../types/auth.types';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiError } from '../utils/apiError.utils';
import { LatexExportService } from '../services/latexExport.service';

const latexExportService = new LatexExportService();

/**
 * POST /api/v1/resume/export/pdf
 * Body: { resumeId: string }
 *
 * Fetches the user's resume from DB, renders the LaTeX template,
 * compiles it with pdflatex, and streams the PDF back to the client.
 */
export const exportResumeToPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const resumeId = req.body.resumeId as string | undefined;

    if (!resumeId) {
        throw new ApiError(400, 'resumeId is required');
    }

    const pdfBuffer = await latexExportService.exportToPdf(userId, resumeId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
});

export const previewResumePdf = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resumeData = req.body;
    const templateId = req.query.templateId as string | undefined;

    if (!resumeData || Object.keys(resumeData).length === 0) {
        throw new ApiError(400, 'resumeData is required in the request body');
    }

    const pdfBuffer = await latexExportService.exportToPdfFromJson(resumeData, templateId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
});
