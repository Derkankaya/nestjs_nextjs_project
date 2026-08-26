import { IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @MinLength(1)
  url!: string;

  @IsString()
  @MinLength(1)
  fileKey!: string;

  @IsString()
  @MinLength(1)
  format!: string;

  @IsInt()
  @Min(1)
  size!: number;

  @IsUUID()
  userId!: string;
}
