import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { compileMigratedResume, getTemplates } from '../controllers/migrate.controller';

const migrateRouter = Router();

// GET /api/v1/migrate/templates — list available templates (auth optional, kept authed for consistency)
migrateRouter.get('/templates', authMiddleware, getTemplates);

// POST /api/v1/migrate/compile — compile resume + template → PDF
migrateRouter.post('/compile', authMiddleware, compileMigratedResume);

export default migrateRouter;
