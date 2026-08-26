import { CommentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ModerateCommentDto {
  @IsEnum(CommentStatus)
  status!: CommentStatus;
}
