import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router = Router();
const controller = new AuthController();

// Input Schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    fullName: z.string().optional(),
    role: z.enum(['FREE_USER', 'PREMIUM_USER', 'ADMIN']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(), // optional since it can also be retrieved from cookies
  }),
});

// Bind routers to controller endpoints
router.post('/register', validateRequest(registerSchema), controller.register);
router.post('/login', validateRequest(loginSchema), controller.login);
router.post('/refresh', validateRequest(refreshSchema), controller.refresh);
router.post('/logout', controller.logout);

export default router;
export { router as authRoutes };
