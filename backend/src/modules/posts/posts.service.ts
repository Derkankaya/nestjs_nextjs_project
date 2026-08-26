import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { slugify } from '../../common/utils/slug';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const WORDS_PER_MINUTE = 200;

const postInclude = {
  author: {
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  category: true,
  tags: true,
} satisfies Prisma.PostInclude;

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePostDto) {
    await this.assertAuthorExists(dto.authorId);
    await this.assertCategoryExists(dto.categoryId);
    await this.assertTagsExist(dto.tagIds);

    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title);
    const estimatedReadingTime =
      dto.estimatedReadingTime ?? this.estimateReadingTime(dto.content);

    try {
      return await this.prisma.post.create({
        data: {
          title: dto.title,
          slug,
          excerpt: dto.excerpt,
          content: dto.content,
          coverImage: dto.coverImage,
          status: dto.status ?? PostStatus.DRAFT,
          estimatedReadingTime,
          metaTitle: dto.metaTitle,
          metaDescription: dto.metaDescription,
          authorId: dto.authorId,
          categoryId: dto.categoryId,
          tags: dto.tagIds?.length
            ? { connect: dto.tagIds.map((id) => ({ id })) }
            : undefined,
        },
        include: postInclude,
      });
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  findAll(filters: { status?: PostStatus; categoryId?: string; tagId?: string }) {
    return this.prisma.post.findMany({
      where: {
        status: filters.status,
        categoryId: filters.categoryId,
        tags: filters.tagId ? { some: { id: filters.tagId } } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: postInclude,
    });
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        ...postInclude,
        comments: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    return post;
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        ...postInclude,
        comments: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post slug "${slug}" not found`);
    }

    if (post.status === PostStatus.PUBLISHED) {
      return this.prisma.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
        include: {
          ...postInclude,
          comments: {
            where: { status: 'APPROVED' },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return post;
  }

  async update(id: string, dto: UpdatePostDto) {
    const existing = await this.findById(id);

    if (dto.authorId) {
      await this.assertAuthorExists(dto.authorId);
    }

    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }

    if (dto.tagIds) {
      await this.assertTagsExist(dto.tagIds);
    }

    const slug = dto.slug
      ? slugify(dto.slug)
      : dto.title
        ? slugify(dto.title)
        : undefined;

    const content = dto.content ?? existing.content;
    const estimatedReadingTime =
      dto.estimatedReadingTime ??
      (dto.content ? this.estimateReadingTime(content) : undefined);

    try {
      return await this.prisma.post.update({
        where: { id },
        data: {
          title: dto.title,
          slug,
          excerpt: dto.excerpt,
          content: dto.content,
          coverImage: dto.coverImage,
          status: dto.status,
          estimatedReadingTime,
          metaTitle: dto.metaTitle,
          metaDescription: dto.metaDescription,
          authorId: dto.authorId,
          categoryId: dto.categoryId,
          tags: dto.tagIds
            ? { set: dto.tagIds.map((tagId) => ({ id: tagId })) }
            : undefined,
        },
        include: postInclude,
      });
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.post.delete({ where: { id } });
  }

  private estimateReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  }

  private async assertAuthorExists(authorId: string) {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true },
    });

    if (!author) {
      throw new BadRequestException(`Author ${authorId} not found`);
    }
  }

  private async assertCategoryExists(categoryId?: string) {
    if (!categoryId) {
      return;
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException(`Category ${categoryId} not found`);
    }
  }

  private async assertTagsExist(tagIds?: string[]) {
    if (!tagIds?.length) {
      return;
    }

    const count = await this.prisma.tag.count({
      where: { id: { in: tagIds } },
    });

    if (count !== tagIds.length) {
      throw new BadRequestException('One or more tags were not found');
    }
  }

  private handleUniqueConflict(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Post slug must be unique');
    }
  }
}
