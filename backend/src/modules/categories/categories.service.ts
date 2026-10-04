import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { slugify } from '../../common/utils/slug';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.name);
    // Hata olursa bırak patlasın, PrismaExceptionFilter onu havada yakalayacak!
    return await this.prisma.category.create({
      data: { name: dto.name, slug, description: dto.description },
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { posts: true } } },
    });
    if (!category) throw new NotFoundException(`Category slug "${slug}" not found`);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id); // Varlığını kontrol et
    const slug = dto.slug ? slugify(dto.slug) : dto.name ? slugify(dto.name) : undefined;

    return await this.prisma.category.update({
      where: { id },
      data: { name: dto.name, slug, description: dto.description },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return await this.prisma.category.delete({ where: { id } });
  }
}