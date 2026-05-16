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
