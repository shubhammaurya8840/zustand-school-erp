import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'zustand-public-school-secure-jwt-secret-key-2026-prod',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        staffProfile: true,
        parentProfile: true,
        studentProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is inactive, suspended, or does not exist');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      staff: user.staffProfile,
      parent: user.parentProfile,
      student: user.studentProfile,
    };
  }
}

