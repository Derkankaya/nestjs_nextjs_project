import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class PostsValidatorService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCategoryExists(categoryId?: string) {
    if (!categoryId) return;
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) throw new BadRequestException(`Category ${categoryId} not found`);
  }

  async assertTagsExist(tagIds?: string[]) {
    if (!tagIds?.length) return;
    const count = await this.prisma.tag.count({ where: { id: { in: tagIds } } });
    if (count !== tagIds.length) {
      throw new BadRequestException('One or more tags were not found');
    }
  }
}