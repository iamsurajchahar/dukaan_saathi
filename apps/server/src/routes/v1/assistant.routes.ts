import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireStore } from '../../middleware/tenant.middleware';
import { assistantController } from '../../controllers/assistant.controller';

export const assistantRouter = Router();

assistantRouter.use(authenticate, requireStore);

assistantRouter.post('/chat', assistantController.chat);
