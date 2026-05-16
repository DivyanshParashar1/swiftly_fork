import { Router } from "express";
import multer from "multer";
import { upload } from "../middlewares/multer.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadAndParseResume } from "../controllers/resumeUpload.controller";
import { exportResumeToPdf } from "../controllers/latexExport.controller";

const resumeRouter = Router()


resumeRouter.route('/uploadAndParse').post(authMiddleware, upload.single("resume"), uploadAndParseResume)

// POST /api/v1/resume/export/pdf — compile resume to PDF and stream back
resumeRouter.route('/export/pdf').post(authMiddleware, exportResumeToPdf)

// POST /api/v1/resume/preview — compile from raw JSON and return PDF for iframe preview
import { previewResumePdf } from "../controllers/latexExport.controller";
resumeRouter.route('/preview').post(authMiddleware, previewResumePdf)

// PATCH /api/v1/resume/:id — update full resume tree
import { updateFullResume } from "../controllers/update.controller";
resumeRouter.route('/:id').patch(authMiddleware, updateFullResume)

export default resumeRouter;