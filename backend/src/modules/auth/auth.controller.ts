import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import type{ Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Throttle } from '@nestjs/throttler';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.register(dto);

    // Refresh Token'ı güvenli çerez (HttpOnly Cookie) olarak tarayıcıya ekliyoruz (30 gün)
    if (refreshToken) {
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Canlıda HTTPS zorunlu kılar
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Gün (milisaniye cinsinden)
      });
    }

    return { accessToken, user };
  }
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Dakikada max 5 yanlış deneme / istek sınırı
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(dto);

    // Giriş yapıldığında da 30 günlük güvenli çerezi set ediyoruz
    if (refreshToken) {
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    return { accessToken, user };
  }
}