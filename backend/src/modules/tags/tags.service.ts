import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { slugify } from '../../common/utils/slug';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTagDto) {
    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.name);
    // Hata yakalama işlemi Global Filter'da olduğu için try-catch silindi
    return await this.prisma.tag.create({
      data: { name: dto.name, slug },
    });
  }

  // 🌟 SAYFALAMA VE ARAMA EKLENDİ
  async findAll(limit = 20, offset = 0, search?: string) {
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } },
      }),
      this.prisma.tag.count({ where }),
    ]);

    return { tags, total };
  }

  async findById(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });

    if (!tag) {
      throw new NotFoundException(`Tag ${id} not found`);
    }
    return tag;
  }

  async findBySlug(slug: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      include: { _count: { select: { posts: true } } },
    });

    if (!tag) {
      throw new NotFoundException(`Tag slug "${slug}" not found`);
    }
    return tag;
  }

  async update(id: string, dto: UpdateTagDto) {
    await this.findById(id);

    const slug = dto.slug ? slugify(dto.slug) : dto.name ? slugify(dto.name) : undefined;
    return await this.prisma.tag.update({
      where: { id },
      data: { name: dto.name, slug },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.tag.delete({ where: { id } });
  }
}