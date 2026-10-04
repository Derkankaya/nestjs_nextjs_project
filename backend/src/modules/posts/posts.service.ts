import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PostStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { slugify } from "../../common/utils/slug";
import { estimateReadingTime } from "../../common/utils/reading-time";
import { postInclude, postDetailInclude } from "./post-service/posts.include";
import { buildPostWhere, buildPostOrderBy } from "./post-service/posts.query";
import { PostsValidatorService } from "./post-service/posts-valitador.service";
import { AuthenticatedUser } from "../auth/authenticated-user-interface";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { GetPostsDto } from "./dto/get-post.dto";
import { sanitizeHtmlContent } from "../../common/utils/sanitize";

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: PostsValidatorService
  ) {}

  async createPost(dto: CreatePostDto, user: AuthenticatedUser) {
    await this.validator.assertCategoryExists(dto.categoryId);
    await this.validator.assertTagsExist(dto.tagIds);

    try {
      return await this.prisma.post.create({
        data: {
          title: dto.title,
          slug: dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title),
          excerpt: dto.excerpt,
          content: sanitizeHtmlContent(dto.content),
          coverImage: dto.coverImage,
          status: dto.status ?? PostStatus.DRAFT,
          estimatedReadingTime:
            dto.estimatedReadingTime ?? estimateReadingTime(dto.content),
          metaTitle: dto.metaTitle,
          metaDescription: dto.metaDescription,
          authorId: user.id, // 🔒 asla dto'dan alınmaz
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

  async findAll(
    filters: GetPostsDto,
    options: { includeDrafts?: boolean } = {}
  ) {
    const { limit = 10, offset = 0, sortBy, sortOrder = "desc" } = filters;

    // Taslak koruması kullanıcının gönderdiği filtreden bağımsız, AND ile eklenir
    const where: Prisma.PostWhereInput = options.includeDrafts
      ? buildPostWhere(filters)
      : { AND: [buildPostWhere(filters), { status: PostStatus.PUBLISHED }] };

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        orderBy: buildPostOrderBy(sortBy, sortOrder),
        take: limit,
        skip: offset,
        include: postInclude,
      }),
      this.prisma.post.count({ where }),
    ]);

    return { posts, total };
  }

  async findById(id: string, requestingUser?: AuthenticatedUser) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: postDetailInclude,
    });
    if (!post) throw new NotFoundException(`Post ${id} not found`);

    const isOwnerOrAdmin =
      requestingUser &&
      (post.authorId === requestingUser.id || requestingUser.role === "ADMIN");
    if (post.status !== PostStatus.PUBLISHED && !isOwnerOrAdmin) {
      throw new NotFoundException(`Post ${id} not found`); // varlığını bile sızdırmamak için 404
    }

    return post;
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: postDetailInclude,
    });

    // Taslağın varlığını bile sızdırma
    if (!post || post.status !== PostStatus.PUBLISHED) {
      throw new NotFoundException(`Post slug "${slug}" not found`);
    }

    this.prisma.post
      .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);
    post.viewCount += 1;

    return post;
  }

  async update(id: string, dto: UpdatePostDto, user: AuthenticatedUser) {
    const existing = await this.findById(id, user);
    this.assertOwnership(existing.authorId, user);

    if (dto.categoryId)
      await this.validator.assertCategoryExists(dto.categoryId);
    if (dto.tagIds) await this.validator.assertTagsExist(dto.tagIds);

    const slug = dto.slug
      ? slugify(dto.slug)
      : dto.title
      ? slugify(dto.title)
      : undefined;

    try {
      return await this.prisma.post.update({
        where: { id },
        data: {
          title: dto.title,
          slug,
          excerpt: dto.excerpt,
          content: dto.content ? sanitizeHtmlContent(dto.content) : undefined,
          coverImage: dto.coverImage,
          status: dto.status,
          estimatedReadingTime:
            dto.estimatedReadingTime ??
            (dto.content ? estimateReadingTime(dto.content) : undefined),
          metaTitle: dto.metaTitle,
          metaDescription: dto.metaDescription,
          // 🔒 authorId burada YOK: yazı sahibi update ile değiştirilemez
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

  async updateStatus(id: string, status: PostStatus, user: AuthenticatedUser) {
    const existing = await this.findById(id, user);
    this.assertOwnership(existing.authorId, user);
    return this.prisma.post.update({ where: { id }, data: { status } });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.findById(id, user);
    this.assertOwnership(existing.authorId, user);
    await this.prisma.post.delete({ where: { id } });
  }

  private assertOwnership(authorId: string, user: AuthenticatedUser) {
    if (authorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Bu işlem için yetkiniz yok");
    }
  }

  private handleUniqueConflict(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Post slug must be unique");
    }
  }
}
