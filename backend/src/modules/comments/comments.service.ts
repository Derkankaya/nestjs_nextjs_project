import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

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

  async create(dto: CreateCommentDto) {
    await this.assertPostExists(dto.postId);
    await this.assertUserExists(dto.userId);

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        postId: dto.postId,
        userId: dto.userId,
        status: CommentStatus.PENDING,
      },
      include: commentInclude,
    });
  }

  findAll(filters: { postId?: string; status?: CommentStatus }) {
    return this.prisma.comment.findMany({
      where: {
        postId: filters.postId,
        status: filters.status,
      },
      orderBy: { createdAt: 'desc' },
      include: commentInclude,
    });
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

  async update(id: string, dto: UpdateCommentDto) {
    await this.findById(id);

    return this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
      include: commentInclude,
    });
  }

  async moderate(id: string, dto: ModerateCommentDto) {
    const comment = await this.findById(id);

    if (dto.status === CommentStatus.PENDING) {
      throw new BadRequestException(
        'Moderation must set APPROVED or REJECTED',
      );
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

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.comment.delete({ where: { id } });
  }

  private async assertPostExists(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new BadRequestException(`Post ${postId} not found`);
    }
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException(`User ${userId} not found`);
    }
  }
}
