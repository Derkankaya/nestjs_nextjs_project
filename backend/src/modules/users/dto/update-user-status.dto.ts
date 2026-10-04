import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from "class-validator";
import { UserStatus } from "@prisma/client";

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;

  // Sadece SUSPENDED için zorunlu (gün cinsinden)
  @ValidateIf((o) => o.status === UserStatus.SUSPENDED)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  banDuration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  banReason?: string;
}