import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer'; 
import { PostStatus } from '@prisma/client';

export enum SortBy {
  CREATED_AT = 'createdAt',
  VIEW_COUNT = 'viewCount',
  COMMENTS = 'comments',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetPostsDto {
  // 🚨 Frontend'den gelen sayfalama (limit) değeri. Varsayılan: 10
  @IsOptional()
  @Type(() => Number) 
  @IsInt()
  @Min(1)
  @Max(100) // 👈 Tek seferde 100'den fazla veri çekilmesini engelledik (Performans)
  limit?: number = 10;

  // 🚨 Frontend'den gelen atlama (offset) değeri. Varsayılan: 0
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsEnum(PostStatus, { message: 'Status sadece PUBLISHED veya DRAFT olabilir' })
  status?: PostStatus;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  tagId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}