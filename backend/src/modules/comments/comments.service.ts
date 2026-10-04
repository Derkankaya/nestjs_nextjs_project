import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException, // 🚨 Yeni eklendi (Yetki hatası fırlatmak için)
} from "@nestjs/common";
import { CommentStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ModerateCommentDto } from "./dto/moderate-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { sanitizeHtmlContent } from "../../common/utils/sanitize";

const commentInclude = {
  user: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  post: {
    select: {
      id: true,
      title: true,
      slug: true,
    },
  },
} as const;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommentDto, userId: string) {
    await this.assertPostExists(dto.postId);
    // assertUserExists artık gereksiz — userId token'dan geliyor, zaten AuthGuard DB'de doğruladı

    return this.prisma.comment.create({
      data: {
        content: sanitizeHtmlContent(dto.content),
        postId: dto.postId,
        userId, // 🔒 artık dto'dan değil, authenticated user'dan
        status: CommentStatus.PENDING,
      },
      include: commentInclude,
    });
  }

  // 🌟 STANDART ZARF (ENVELOPE) YAPISI İLE FİLTRELİ LİSTELEME
  async findAll(
    filters: { postId?: string; status?: CommentStatus },
    limit = 20,
    offset = 0
  ) {
    const where = {
      postId: filters.postId,
      status: filters.status,
    };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: commentInclude,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return { comments, total };
  }

  // 🌟 POST ID'YE GÖRE YORUMLARI ÇEKME (Zarf Formatında ve Sayfalamalı)
  async findByPost(postId: string, limit = 20, offset = 0) {
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId, status: CommentStatus.APPROVED },
        take: limit, // 🚨 SAYFALAMA EKLENDİ
        skip: offset, // 🚨 SAYFALAMA EKLENDİ
        orderBy: { createdAt: "desc" }, // En yeni yorumlar üstte olsun
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.comment.count({
        where: { postId, status: CommentStatus.APPROVED },
      }),
    ]);

    return { comments, total };
  }

  async findById(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: commentInclude,
    });

    if (!comment) {
      throw new NotFoundException(`Comment ${id} not found`);
    }

    return comment;
  }

  // 🚨 GÜNCELLENDİ: Sadece sahibi veya Admin değiştirebilir
  async update(id: string, dto: UpdateCommentDto, user: any) {
    const comment = await this.findById(id);

    if (comment.userId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Bu yorumu güncelleme yetkiniz yok!");
    }

    return this.prisma.comment.update({
      where: { id },
      data: { content: sanitizeHtmlContent(dto.content) },
      include: commentInclude,
    });
  }

  async moderate(id: string, dto: ModerateCommentDto) {
    const comment = await this.findById(id);

    if (dto.status === CommentStatus.PENDING) {
      throw new BadRequestException("Moderation must set APPROVED or REJECTED");
    }

    if (
      comment.status !== CommentStatus.PENDING &&
      comment.status === dto.status
    ) {
      return comment;
    }

    return this.prisma.comment.update({
      where: { id },
      data: { status: dto.status },
      include: commentInclude,
    });
  }

  // 🚨 GÜNCELLENDİ: Sadece sahibi veya Admin silebilir
  async remove(id: string, user: any) {
    const comment = await this.findById(id);

    if (comment.userId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Bu yorumu silme yetkiniz yok!");
    }

    await this.prisma.comment.delete({ where: { id } });
  }

  private async assertPostExists(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new BadRequestException(`Post ${postId} not found`);
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new BadRequestException(`User ${userId} not found`);
  }
}
