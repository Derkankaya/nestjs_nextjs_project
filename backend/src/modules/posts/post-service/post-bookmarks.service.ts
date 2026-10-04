import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class PostBookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleBookmark(userId: string, postId: string) {
    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingBookmark) {
      await this.prisma.bookmark.delete({ where: { id: existingBookmark.id } });
      return { bookmarked: false };
    }

    await this.prisma.bookmark.create({ data: { userId, postId } });
    return { bookmarked: true };
  }

  // 🚨 Sayfalama eklendi
  async getMyBookmarks(userId: string, limit = 20, offset = 0) {
    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
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
      this.prisma.bookmark.count({ where: { userId } }),
    ]);

    return { posts: bookmarks.map((b) => b.post), total };
  }
}