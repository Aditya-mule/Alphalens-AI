import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository, CreateUserData } from './auth.repository.js';
import { Role } from '@prisma/client';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async register(data: CreateUserData & { fullName?: string }) {
    const existingUser = await this.authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('UserAlreadyExists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    const user = await this.authRepository.createUser({
      email: data.email,
      passwordHash,
      role: data.role || Role.FREE_USER,
      fullName: data.fullName,
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      ...tokens,
    };
  }

  async login(email: string, passwordHash: string) {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('InvalidCredentials');
    }

    const isMatch = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!isMatch) {
      throw new Error('InvalidCredentials');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      ...tokens,
    };
  }

  async refreshSession(refreshToken: string) {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'super-secret-alphalens-refresh-key';
      const decoded = jwt.verify(refreshToken, refreshSecret) as {
        userId: string;
        email: string;
        role: Role;
      };

      const user = await this.authRepository.findUserById(decoded.userId);
      if (!user) {
        throw new Error('UserNotFound');
      }

      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        ...tokens,
      };
    } catch (error) {
      throw new Error('InvalidRefreshToken');
    }
  }

  private generateTokens(payload: { userId: string; email: string; role: Role }) {
    const jwtSecret = process.env.JWT_SECRET || 'super-secret-alphalens-jwt-key';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'super-secret-alphalens-refresh-key';

    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
    });

    const refreshToken = jwt.sign(payload, refreshSecret, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
    });

    return { accessToken, refreshToken };
  }
}

export default AuthService;
