import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { slugify } from '../../common/utils/slug';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTagDto) {
    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.name);

    try {
      return await this.prisma.tag.create({
        data: {
          name: dto.name,
          slug,
        },
      });
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
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

    const slug = dto.slug
      ? slugify(dto.slug)
      : dto.name
        ? slugify(dto.name)
        : undefined;

    try {
      return await this.prisma.tag.update({
        where: { id },
        data: {
          name: dto.name,
          slug,
        },
      });
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.tag.delete({ where: { id } });
  }

  private handleUniqueConflict(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Tag slug must be unique');
    }
  }
}
