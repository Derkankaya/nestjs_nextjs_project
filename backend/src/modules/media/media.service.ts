import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateMediaDto } from "./dto/create-media.dto";
import { UpdateMediaDto } from "./dto/update-media.dto";

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMediaDto, user: any) {
    // 🚨 GÜVENLİK: DTO'dan gelen userId'yi eziyoruz.
    // Sadece token'ın sahibi kimse, medya onun adına yüklenir!
    dto.userId = user.id;

    // Hata yakalamayı Global Filter'a (PrismaExceptionFilter) bıraktık.
    return await this.prisma.media.create({ data: dto });
  }

  // 🌟 SAYFALAMA EKLENDİ
  async findAll(userId?: string, limit = 20, offset = 0) {
    const where = { userId };

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.media.count({ where }),
    ]);

    return { media, total };
  }

  async findById(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException(`Media ${id} not found`);
    return media;
  }

  async update(id: string, dto: UpdateMediaDto, user: any) {
    const media = await this.findById(id);

    // 🚨 YETKİ KONTROLÜ: Sadece sahibi veya ADMIN güncelleyebilir
    if (media.userId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Bu medyayı güncelleme yetkiniz yok!");
    }

    return await this.prisma.media.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: any) {
    const media = await this.findById(id);

    // 🚨 YETKİ KONTROLÜ: Sadece sahibi veya ADMIN silebilir
    if (media.userId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Bu medyayı silme yetkiniz yok!");
    }
    await this.prisma.media.delete({ where: { id } });
  }
}
