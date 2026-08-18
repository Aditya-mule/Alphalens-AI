import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import logger from '../../config/logger.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, fullName, role } = req.body;
      logger.info(`Register request received for email: ${email}`);

      const result = await this.authService.register({
        email,
        passwordHash: password,
        fullName,
        role,
      });

      this.setRefreshTokenCookie(res, result.refreshToken);

      res.status(211).json({
        message: 'Registration successful',
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error: any) {
      if (error.message === 'UserAlreadyExists') {
        res.status(409).json({ error: 'Conflict', message: 'A user with this email address already exists' });
        return;
      }
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      logger.info(`Login request received for email: ${email}`);

      const result = await this.authService.login(email, password);

      this.setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error: any) {
      if (error.message === 'InvalidCredentials') {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
        return;
      }
      next(error);
    }
  };

  private getRefreshToken(req: Request): string | undefined {
    if (req.body.refreshToken) return req.body.refreshToken;
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=').map((c) => c.trim());
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    return cookies['refreshToken'];
  }

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = this.getRefreshToken(req);

      if (!refreshToken) {
        res.status(400).json({ error: 'BadRequest', message: 'Refresh token is required' });
        return;
      }

      logger.info('Refreshing session using refresh token');
      const result = await this.authService.refreshSession(refreshToken);

      this.setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        message: 'Session refreshed successfully',
        accessToken: result.accessToken,
      });
    } catch (error: any) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token' });
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  };

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
  }
}

export default AuthController;
