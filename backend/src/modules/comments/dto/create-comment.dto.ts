import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsUUID()
  postId!: string;

  @IsUUID()
  userId!: string;
}
