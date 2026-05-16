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


export default resumeRouter;