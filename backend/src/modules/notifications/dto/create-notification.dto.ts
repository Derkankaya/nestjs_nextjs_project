import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

// Tek bir kullanıcıya atılacak manuel mesaj için
export class CreateSingleNotificationDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;
}

// Toplu duyurular için (Seçilenlere, belirli bir role veya herkese)
export class CreateBulkNotificationDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsArray()
  userIds?: string[]; // Sadece listeden tiklenen kişilere atmak için

  @IsOptional()
  @IsEnum(Role)
  targetRole?: Role; // Sadece "AUTHOR" olanlara atmak için vs.
}