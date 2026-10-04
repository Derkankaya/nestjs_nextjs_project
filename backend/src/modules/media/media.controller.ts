import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaService } from './media.service';
import { AuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // 🔒 KORUMALI: Oturum açan kullanıcı isteği (req) servise yollanır
  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateMediaDto) {
    return this.mediaService.create(dto, req.user);
  }

  // 🔓 HERKESE AÇIK (Sayfalama eklendi)
  @Public()
  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query('userId') userId?: string,
    
  ) {
    return this.mediaService.findAll(
      userId, 
      pagination.limit,
      pagination.offset);
  }

  // 🔓 HERKESE AÇIK
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.findById(id);
  }

  // 🔒 KORUMALI: Sadece sahibi/admin için req.user yollanır
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMediaDto,
  ) {
    return this.mediaService.update(id, dto, req.user);
  }

  // 🔒 KORUMALI: Sadece sahibi/admin için req.user yollanır
  @UseGuards(AuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.remove(id, req.user);
  }
}