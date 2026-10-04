import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import {
  CreateBulkNotificationDto,
  CreateSingleNotificationDto,
} from "./dto/create-notification.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";

@UseGuards(AuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // 🔒 KALKAN EKLENDİ: Sadece ADMIN'ler atabilir
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Post("single")
  sendSingle(@Body() dto: CreateSingleNotificationDto) {
    return this.notificationsService.sendSingle(dto);
  }

  // 🔒 KALKAN EKLENDİ: Sadece ADMIN'ler atabilir
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  @Post("bulk")
  sendBulk(@Body() dto: CreateBulkNotificationDto) {
    return this.notificationsService.sendBulk(dto);
  }

  // 🔒 Parametreden kurtulduk, sadece token sahibi kendi bildirimini görebilir

  @Get()
  getUserNotifications(@Req() req: any, @Query() pagination: PaginationDto) {
    // 🚨 Number() dönüşümleri ve ternary operatörler çöpe gitti!
    return this.notificationsService.getUserNotifications(
      req.user.id,
      pagination.limit,
      pagination.offset
    );
  }

  @Patch("mark-all-read")
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete("clear")
  @HttpCode(HttpStatus.OK)
  clearAll(@Req() req: any) {
    return this.notificationsService.clearAll(req.user.id);
  }

  @Patch(":id/read")
  markAsRead(@Param("id", ParseUUIDPipe) id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", ParseUUIDPipe) id: string, @Req() req: any) {
    return this.notificationsService.remove(id, req.user.id);
  }
}
