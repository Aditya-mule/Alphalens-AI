import { Router } from 'express';
import { z } from 'zod';
import { ChatController } from './chat.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router = Router();
const controller = new ChatController();

const chatValidationSchema = z.object({
  params: z.object({
    ticker: z.string().min(1, 'Ticker symbol parameter is required'),
  }),
  body: z.object({
    query: z.string().min(1, 'Chat query cannot be empty'),
    chatHistory: z.array(z.any()).optional(),
  }),
});

router.post(
  '/:ticker/chat',
  authenticateJWT as any,
  validateRequest(chatValidationSchema),
  controller.ask
);

export default router;
export { router as chatRoutes };
