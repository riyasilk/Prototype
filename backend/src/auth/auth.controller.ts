import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Public } from '../decorators/public.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as express from 'express';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  async login(
    @Req() request: any,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.login(
      request.user,
    );

    // Set tokens in HTTP-only cookies
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { user };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: express.Request,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const token =
      request.cookies?.['refresh_token'] || request.body?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const payload = await this.authService.verifyRefreshToken(token);
    const validatedUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    const tokens = await this.authService.login(validatedUser);

    response.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { success: true };
  }

  @Get('me')
  async me(@Req() request: any) {
    const userId = request.user?.userId || request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: any,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const userId = request.user?.userId || request.user?.id;
    if (userId) {
      await this.authService.logout(userId);
    }
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { success: true, message: 'Logged out successfully' };
  }
}
