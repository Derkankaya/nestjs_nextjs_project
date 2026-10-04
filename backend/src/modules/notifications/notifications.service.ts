import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateSingleNotificationDto,
  CreateBulkNotificationDto,
} from "./dto/create-notification.dto";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. TEKİL BİLDİRİM
  async sendSingle(dto: CreateSingleNotificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    return this.prisma.notification.create({
      data: {
        title: dto.title,
        message: dto.message,
        userId: dto.userId,
      },
    });
  }

  // 2. TOPLU DUYURU (BULK)
  async sendBulk(dto: CreateBulkNotificationDto) {
    let targetUserIds: string[] = [];

    if (dto.userIds && dto.userIds.length > 0) {
      targetUserIds = dto.userIds;
    } else if (dto.targetRole) {
      const users = await this.prisma.user.findMany({
        where: { role: dto.targetRole },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    } else {
      const users = await this.prisma.user.findMany({ select: { id: true } });
      targetUserIds = users.map((u) => u.id);
    }

    const notificationsData = targetUserIds.map((id) => ({
      title: dto.title,
      message: dto.message,
      userId: id,
    }));

    if (notificationsData.length === 0) {
      return {
        success: true,
        message: "Bildirim gönderilecek uygun kullanıcı bulunamadı.",
        count: 0,
      };
    }

    const result = await this.prisma.notification.createMany({
      data: notificationsData,
    });

    return {
      success: true,
      message: `${result.count} kullanıcıya bildirim başarıyla gönderildi.`,
      count: result.count,
    };
  }

  // 🌟 SAYFALAMA EKLENDİ
  async getUserNotifications(userId: string, limit = 20, offset = 0) {
    const where = { userId };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  // 🚨 HATA VE YETKİ KONTROLÜ EKLENDİ
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) throw new NotFoundException("Bildirim bulunamadı");
    if (notification.userId !== userId)
      throw new ForbiddenException("Bu bildirim size ait değil");

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // 🚨 HATA VE YETKİ KONTROLÜ EKLENDİ
  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) throw new NotFoundException("Bildirim bulunamadı");
    if (notification.userId !== userId)
      throw new ForbiddenException("Bu bildirimi silemezsiniz");

    return this.prisma.notification.delete({ where: { id } });
  }

  // 🚀 BONUS: TÜMÜNÜ OKUNDU İŞARETLE
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: "Tüm bildirimler okundu olarak işaretlendi" };
  }

  // 🚀 BONUS: TÜMÜNÜ TEMİZLE
  async clearAll(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return { message: "Tüm bildirimler temizlendi" };
  }
}
