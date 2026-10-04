import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateMessageDto } from "./dto/create-message.dto";

const messageInclude = {
  sender: {
    select: { id: true, name: true, email: true },
  },
  recipient: {
    select: { id: true, name: true, email: true },
  },
} as const;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(senderId: string, dto: CreateMessageDto) {
    return this.prisma.message.create({
      data: {
        content: dto.content,
        senderId,
        recipientId: dto.recipientId,
      },
      include: messageInclude,
    });
  }

  // 🌟 GELEN KUTUSU
  async getInbox(userId: string, limit = 20, offset = 0) {
    const where = {
      recipientId: userId,
      deletedByRecipient: false,
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: messageInclude,
      }),
      this.prisma.message.count({ where }),
    ]);

    return { messages, total };
  }

  // 🌟 GİDEN KUTUSU
  async getOutbox(userId: string, limit = 20, offset = 0) {
    const where = {
      senderId: userId,
      deletedBySender: false,
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: messageInclude,
      }),
      this.prisma.message.count({ where }),
    ]);

    return { messages, total };
  }

  // 🚨 MESAJI OKUNDU İŞARETLE
  async markAsRead(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id } });

    if (!message) {
      throw new NotFoundException("Mesaj bulunamadı");
    }

    if (message.recipientId !== userId) {
      throw new ForbiddenException(
        "Bu mesajı okundu olarak işaretlemeye yetkiniz yok"
      );
    }

    return this.prisma.message.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // 🚨 AKILLI SİLME (Soft & Hard Delete Kombinasyonu)
  async remove(id: string, userId: string) {
    const message = await this.prisma.message.findUnique({ where: { id } });

    if (!message) throw new NotFoundException("Mesaj bulunamadı");

    const isSender = message.senderId === userId;
    const isRecipient = message.recipientId === userId;

    if (!isSender && !isRecipient) {
      throw new ForbiddenException("Bu mesajı silmeye yetkiniz yok");
    }

    const otherSideAlreadyDeleted = isSender
      ? message.deletedByRecipient
      : message.deletedBySender;

    if (otherSideAlreadyDeleted) {
      await this.prisma.message.delete({ where: { id } });
      return { status: "deleted_permanently" };
    }

    await this.prisma.message.update({
      where: { id },
      data: isSender ? { deletedBySender: true } : { deletedByRecipient: true },
    });

    return { status: "soft_deleted" };
  }

  // 🚨 GELEN KUTUSUNU TEMİZLE
  async clearInbox(userId: string) {
    await this.prisma.message.updateMany({
      where: { recipientId: userId, deletedByRecipient: false },
      data: { deletedByRecipient: true },
    });

    return { message: "Gelen kutusu temizlendi" };
  }

  // 🚨 GİDEN KUTUSUNU TEMİZLE
  async clearOutbox(userId: string) {
    await this.prisma.message.updateMany({
      where: { senderId: userId, deletedBySender: false },
      data: { deletedBySender: true },
    });

    return { message: "Giden kutusu temizlendi" };
  }
}
