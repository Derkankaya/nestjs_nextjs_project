import { IsInt, IsString, IsUUID, Max, Matches, Min, MinLength, IsIn } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @MinLength(1)
  url!: string;

  // 🚨 GÜVENLİK: Path Traversal (../../) saldırılarını engellemek için regex ekledik
  @IsString()
  @MinLength(1)
  @Matches(/^[a-zA-Z0-9_\-\.\/]+$/, {
    message: 'FileKey yalnızca geçerli karakterler, tire, alt çizgi ve nokta içerebilir.',
  })
  fileKey!: string;

  // 🚨 GÜVENLİK: Sadece izin verilen güvenli formatlar (White-list) kabul edilir
  @IsString()
  @IsIn(['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'mp4'], {
    message: 'Desteklenmeyen dosya formatı!',
  })
  format!: string;

  // 🚨 GÜVENLİK: Maksimum dosya boyutu sınırı (Örn: En fazla 5 MB = 5242880 byte)
  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024, { message: 'Dosya boyutu 5 MB den büyük olamaz!' })
  size!: number;

  @IsUUID()
  userId!: string;
}