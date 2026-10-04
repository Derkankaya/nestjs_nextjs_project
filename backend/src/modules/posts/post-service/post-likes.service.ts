import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class PostLikesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleLike(postId: string, userId: string) {
    const postExists = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) throw new NotFoundException(`Post ${postId} not found`);

    const existingLike = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingLike) {
      await this.prisma.like.delete({ where: { id: existingLike.id } });
      return { message: 'Post unliked', liked: false };
    } 
    
    await this.prisma.like.create({ data: { userId, postId } });
    return { message: 'Post liked', liked: true };
  }

  // 🚨 5.000 makale çökmesini engelleyen sayfalama (limit/offset) eklendi
  async getMyLikes(userId: string, limit = 20, offset = 0) {
    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId },
        take: Number(limit),
        skip: Number(offset),
        include: {
          post: {
            include: {
              category: true,
              author: { select: { name: true, avatar: true, role: true } },
              tags: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.like.count({ where: { userId } }),
    ]);

    return { posts: likes.map((l) => l.post), total };
  }
}