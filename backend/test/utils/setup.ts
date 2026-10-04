import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { PrismaExceptionFilter } from "../../src/common/filters/prisma-exception.filter";
import { PrismaService } from "../../src/common/prisma/prisma.service";
import * as bcrypt from "bcrypt";

/**
 * createTestApp() fonksiyonu tüm E2E test dosyalarında:
 * 1. NestJS Testing Module oluşturur.
 * 2. Uygulama ayağa kalkarken Pipe ve ExceptionFilter ayarlarını yapar.
 * 3. Hiyerarşik veritabanı temizliği (Cascade Silme) işlemlerini yapar.
 * 4. Testlerde kullanılacak 'app', 'prisma' ve standart bir 'hashedPassword' döner.
 */
export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
  hashedPassword: string;
}> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.init();

  const prisma = app.get(PrismaService);

  // 🚨 İLİŞKİSEL TABLO SIRASINA GÖRE KUSURSUZ TEMİZLİK (Tüm dosyalardaki ortak nokta)
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.media.deleteMany();
  await prisma.post.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Tüm testlerde sıkça kullanılan standart şifre hash'i (Burada üretip teste paslıyoruz)
  const hashedPassword = await bcrypt.hash("password123", 10);

  return { app, prisma, hashedPassword };
}
