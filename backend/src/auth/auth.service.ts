import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, passwordPlain: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      user.isActive &&
      (await bcrypt.compare(passwordPlain, user.passwordHash))
    ) {
      const { passwordHash, refreshTokenHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, name: user.name };

    const accessToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_ACCESS_SECRET') || 'access-secret',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'refresh-secret',
      expiresIn: '7d',
    });

    // Hash refresh token and save in DB
    const salt = await bcrypt.genSalt(10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, salt);
    await this.usersService.updateAuth(user.id, {
      refreshTokenHash,
      lastLoginAt: new Date(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async verifyRefreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'refresh-secret',
      });

      const user = await this.usersService.findByEmail(payload.email);
      if (!user || !user.isActive || !user.refreshTokenHash) {
        throw new UnauthorizedException('Session expired or user inactive');
      }

      const isMatch = await bcrypt.compare(token, user.refreshTokenHash);
      if (!isMatch) {
        throw new UnauthorizedException('Session invalidated');
      }

      return payload;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.updateAuth(userId, {
      refreshTokenHash: null,
    });
  }
}
