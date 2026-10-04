import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard'; // 🚨 EKLENDİ
import { Roles } from '../auth/roles.decorator'; // 🚨 EKLENDİ
import { Public } from '../auth/public.decorator';


@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // 🔒 KORUMALI: SADECE ADMIN (VEYA YETKİLİ) OLUŞTURABİLİR
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN') 
  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Public()
  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
  ) {
    return this.tagsService.findAll(limit ? Number(limit) : 20, offset ? Number(offset) : 0, search);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tagsService.findBySlug(slug);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.findById(id);
  }

  // 🔒 KORUMALI: SADECE ADMIN GÜNCELLEYEBİLİR
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  // 🔒 KORUMALI: SADECE ADMIN SİLEBİLİR
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.remove(id);
  }
}