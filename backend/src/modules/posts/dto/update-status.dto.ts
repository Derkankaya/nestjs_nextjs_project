// dto/update-status.dto.ts
import { IsEnum } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(PostStatus)
  status!: PostStatus;
}