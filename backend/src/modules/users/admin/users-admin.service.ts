import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserStatus } from "@prisma/client";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { toPublicUser } from "../../../common/utils/public-user";
import { UpdateUserStatusDto } from "../dto/update-user-status.dto";

@Injectable()
export class UsersAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, limit = 10, offset = 0) {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        include: { _count: { select: { posts: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users: users.map((u) => toPublicUser(u)), total };
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException("Kullanıcı bulunamadı");

    let bannedUntil: Date | null = null;
    let banReason: string | null = dto.banReason?.trim() || null;

    if (dto.status === UserStatus.SUSPENDED) {
      bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + dto.banDuration!); // DTO SUSPENDED için zorunlu kılıyor
    } else if (dto.status === UserStatus.ACTIVE) {
      banReason = null;
    }

    const reasonText = banReason ?? "Belirtilmedi";
    let notification: { title: string; message: string } | null = null;

    if (dto.status === UserStatus.SUSPENDED) {
      notification = {
        title: "Hesabınız Askıya Alındı",
        message: `Kurallara uymadığınız gerekçesiyle ${dto.banDuration} gün süreyle askıya alındınız. Sebep: ${reasonText}`,
      };
    } else if (dto.status === UserStatus.BANNED) {
      notification = {
        title: "Hesabınız Kapatıldı",
        message: `Topluluk kurallarını ihlal ettiğiniz için yasaklandınız. Sebep: ${reasonText}`,
      };
    } else if (dto.status === UserStatus.ACTIVE) {
      notification = {
        title: "Hesabınız Yeniden Aktif",
        message: "Kısıtlamalar kaldırıldı. Platforma tekrar hoş geldiniz!",
      };
    }

    // Güncelleme ve bildirim ya birlikte olur ya hiç olmaz
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id },
        data: { status: dto.status, bannedUntil, banReason },
      });
      if (notification) {
        await tx.notification.create({ data: { userId: id, ...notification } });
      }
      return result;
    });

    return toPublicUser(updated);
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") throw new NotFoundException("Kullanıcı bulunamadı");
        if (error.code === "P2003") {
          throw new ConflictException(
            "Kullanıcının bağlı içerikleri var. Silmek yerine hesabı BANNED yapın.",
          );
        }
      }
      throw error;
    }
  }
}