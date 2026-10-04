import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto'; // Yolunu projene göre düzelt

export class GetUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
  
  // Gelecekte buraya @IsOptional() @IsEnum(UserRole) role?: UserRole; gibi şeyler de eklenebilir.
}