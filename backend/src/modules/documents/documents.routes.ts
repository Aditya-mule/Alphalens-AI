import { Router } from 'express';
import { DocumentsController } from './documents.controller.js';
import { upload } from '../../middleware/multer.middleware.js';
import { authenticateJWT, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new DocumentsController();

// PDF Document Ingestion - restricted to PREMIUM_USER and ADMIN roles
router.post(
  '/upload',
  authenticateJWT as any,
  requireRole(['PREMIUM_USER', 'ADMIN']) as any,
  upload.single('file'),
  controller.upload
);

// Retrive status metrics
router.get('/status/:docId', authenticateJWT as any, controller.getStatus);
router.get('/', authenticateJWT as any, controller.list);

export default router;
export { router as documentsRoutes };
