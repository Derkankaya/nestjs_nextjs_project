import { Prisma } from '@prisma/client';

export const postInclude = {
  author: {
    select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
  },
  category: true,
  tags: true,
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostInclude;

export const postDetailInclude = {
  ...postInclude,
  comments: {
    where: { status: 'APPROVED' as const },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.PostInclude;