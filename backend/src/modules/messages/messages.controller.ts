import { 
  Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req, Query, ParseUUIDPipe, HttpCode, HttpStatus 
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@UseGuards(AuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateMessageDto) {
    return this.messagesService.create(req.user.id, dto);
  }

  // 🌟 SAYFALAMA PARAMETRELERİ EKLENDİ
  @Get('inbox')
  getInbox(
    @Req() req: any,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagesService.getInbox(req.user.id, pagination.limit, pagination.offset);
  }

  // 🌟 SAYFALAMA PARAMETRELERİ EKLENDİ
  @Get('outbox')
  getOutbox(
    @Req() req: any,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagesService.getOutbox(req.user.id, pagination.limit, pagination.offset);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.messagesService.markAsRead(id, req.user.id);
  }
  @Delete('inbox/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearInbox(@Req() req: any) {
    return this.messagesService.clearInbox(req.user.id);
  }

  @Delete('outbox/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearOutbox(@Req() req: any) {
    return this.messagesService.clearOutbox(req.user.id);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.messagesService.remove(id, req.user.id);
  }
}