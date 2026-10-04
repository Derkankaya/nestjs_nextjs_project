import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { PublicUser, toPublicUser } from "../../common/utils/public-user";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    // Rol burada verilmez, create() varsayılan olarak USER atar
    const user = await this.usersService.create(dto);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Önce şifre: yanlış şifreyle hesap durumu (ban/askı) öğrenilemesin
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException(
        "Hesabınız kalıcı olarak kapatılmıştır. Sistem yöneticisiyle iletişime geçin."
      );
    }

    // AuthGuard ile aynı kural: askı süresi dolduysa giriş serbest
    if (
      user.status === UserStatus.SUSPENDED &&
      user.bannedUntil &&
      user.bannedUntil > new Date()
    ) {
      throw new UnauthorizedException(
        "Hesabınız kurallara uymadığınız için geçici olarak askıya alınmıştır."
      );
    }

    return this.generateTokens(toPublicUser(user));
  }

  private generateTokens(user: PublicUser): AuthResult {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: "15m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: "30d",
    });

    return { accessToken, refreshToken, user };
  }
}