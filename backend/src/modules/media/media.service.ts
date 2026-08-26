import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMediaDto) {
    await this.assertUserExists(dto.userId);

    try {
      return await this.prisma.media.create({ data: dto });
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  findAll(userId?: string) {
    return this.prisma.media.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });

    if (!media) {
      throw new NotFoundException(`Media ${id} not found`);
    }

    return media;
  }

  async update(id: string, dto: UpdateMediaDto) {
    await this.findById(id);

    if (dto.userId) {
      await this.assertUserExists(dto.userId);
    }

    try {
      return await this.prisma.media.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleUniqueConflict(error);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.media.delete({ where: { id } });
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

  private handleUniqueConflict(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Media fileKey must be unique');
    }
  }
}
