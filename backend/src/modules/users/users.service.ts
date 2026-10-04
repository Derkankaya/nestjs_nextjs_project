import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PostStatus, Prisma, Role, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PublicUser, toPublicUser } from "../../common/utils/public-user";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";


const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Rol DTO'dan okunmaz. Çağıran açıkça verir, varsayılan USER.
  async create(dto: CreateUserDto, role: Role = Role.USER): Promise<PublicUser> {
    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          username: dto.username,
          password,
          role,
          bio: dto.bio,
          avatar: dto.avatar,
        },
      });
      return toPublicUser(user);
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  // Giriş yapan kullanıcının kendi profili (tam bilgi, şifresiz)
  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Kullanıcı bulunamadı");
    return toPublicUser(user);
  }

  // Herkese açık profil: e-posta, status, ban bilgisi ve DRAFT yazılar yok
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        posts: {
          where: { status: PostStatus.PUBLISHED },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getAuthorProfile(username: string) {
    const author = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        posts: {
          where: { status: PostStatus.PUBLISHED },
          include: { category: true, tags: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!author) throw new NotFoundException("Yazar bulunamadı");
    return author;
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<PublicUser> {
    const data: Prisma.UserUpdateInput = {
      email: dto.email,
      name: dto.name,
      username: dto.username,
      avatar: dto.avatar,
      bio: dto.bio,
    };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    try {
      const user = await this.prisma.user.update({ where: { id: userId }, data });
      return toPublicUser(user);
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  async getStats(userId: string) {
    const [totalPosts, totalComments, views] = await Promise.all([
      this.prisma.post.count({ where: { authorId: userId, status: PostStatus.PUBLISHED } }),
      this.prisma.comment.count({ where: { post: { authorId: userId } } }),
      this.prisma.post.aggregate({
        where: { authorId: userId },
        _sum: { viewCount: true },
      }),
    ]);

    return { totalPosts, totalComments, totalViews: views._sum.viewCount ?? 0 };
  }

  async findByIdForAuth(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, status: true, bannedUntil: true },
    });
  }

  private handleUniqueConflict(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target.join(",") : String(target ?? "");
      if (fields.includes("email")) throw new ConflictException("Email is already registered");
      if (fields.includes("username")) throw new ConflictException("Username is already taken");
      throw new ConflictException("Email veya kullanıcı adı sistemde mevcut");
    }
  }
}