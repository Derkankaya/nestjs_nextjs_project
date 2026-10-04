import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { UserStatus } from "@prisma/client";
import { Request } from "express";
import { UsersService } from "../users/users.service";
import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException("Token bulunamadı");
    }

    // Sadece JWT doğrulaması try içinde: diğer hatalar olduğu gibi fırlar
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException("Geçersiz veya süresi dolmuş token");
    }

    // Rol ve durum her istekte DB'den okunur: token eski olsa bile yetki güncel kalır
    const user = await this.usersService.findByIdForAuth(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Kullanıcı bulunamadı");
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException("Hesabınız kalıcı olarak kapatılmıştır");
    }

    if (
      user.status === UserStatus.SUSPENDED &&
      user.bannedUntil &&
      user.bannedUntil > new Date()
    ) {
      throw new ForbiddenException(
        `Hesabınız ${user.bannedUntil.toISOString()} tarihine kadar askıya alınmıştır`,
      );
    }
    // SUSPENDED ama bannedUntil geçmişse: askı bitmiş sayılır, giriş serbest

    request["user"] = { id: user.id, email: user.email, role: user.role };
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}