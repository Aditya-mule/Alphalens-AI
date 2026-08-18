import prisma from '../../config/prisma.js';
import { Role } from '@prisma/client';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role?: Role;
  fullName?: string;
}

export class AuthRepository {
  async createUser(data: CreateUserData) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role || 'FREE_USER',
        },
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
        },
      });

      return {
        ...user,
        profile,
      };
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }
}

export default AuthRepository;
