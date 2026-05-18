import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getTemplates,
  getTemplateMeta,
  getTemplateSchema,
  compileMigratedResume,
  getLatexSource,
} from '../controllers/migrate.controller';

const migrateRouter = Router();

// GET /api/v1/migrate/templates — list available templates
migrateRouter.get('/templates', authMiddleware, getTemplates);

// GET /api/v1/migrate/meta/:templateId — template.meta.json (defaultSectionOrder, requiredUserInputs)
migrateRouter.get('/meta/:templateId', authMiddleware, getTemplateMeta);

// GET /api/v1/migrate/schema/:templateId — mapToDbSchema.json (drives USER_INPUT form)
migrateRouter.get('/schema/:templateId', authMiddleware, getTemplateSchema);

// POST /api/v1/migrate/compile — compile resume + template → PDF
migrateRouter.post('/compile', authMiddleware, compileMigratedResume);

// POST /api/v1/migrate/latex — render resume → .tex string for download
migrateRouter.post('/latex', authMiddleware, getLatexSource);

export default migrateRouter;
