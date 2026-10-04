import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit tam sayı olmalıdır' })
  @Min(1, { message: 'Limit en az 1 olmalıdır' })
  @Max(100, { message: 'Limit en fazla 100 olmalıdır' })
  limit?: number = 20; // Senin projede genelde 20 kullanılmış, varsayılanı 20 yapalım

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Offset tam sayı olmalıdır' })
  @Min(0, { message: 'Offset negatif olamaz' })
  offset?: number = 0;
}