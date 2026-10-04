import { Prisma } from '@prisma/client';
import { GetPostsDto } from '../dto/get-post.dto';

export function buildPostWhere(filters: GetPostsDto): Prisma.PostWhereInput {
  const { status, categoryId, tagId, authorId, search } = filters;

  const where: Prisma.PostWhereInput = {
    status,
    categoryId,
    authorId,
    tags: tagId ? { some: { id: tagId } } : undefined,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { category: { name: { contains: search, mode: 'insensitive' } } },
      { tags: { some: { name: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  return where;
}

export function buildPostOrderBy(
  sortBy: string | undefined,
  sortOrder: Prisma.SortOrder,
): Prisma.PostOrderByWithRelationInput {
  switch (sortBy) {
    case 'viewCount':
      return { viewCount: sortOrder };
    case 'comments':
      return { comments: { _count: sortOrder } };
    default:
      return { createdAt: sortOrder };
  }
}