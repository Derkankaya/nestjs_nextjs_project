import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new PrismaExceptionFilter());

  // CORS ve Çerez İzinleri (Frontend 3000 portundan geldiği için şart)
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true, // 30 günlük Refresh Token çerezi için zorunlu!
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Frontend'den bilmediğimiz bir veri gelirse 400 atar
      transform: true,
      // 🚨 SİHİRLİ DOKUNUŞ BURASI:
      transformOptions: {
        enableImplicitConversion: true, // URL'den gelen string'leri otomatik sayıya/bool'a çevirir
      },
    }),
  );

  // Portu kesin olarak 3001 sabitliyoruz (veya çevreden alıyoruz)
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Backend şu adreste çalışıyor: http://localhost:${port}`);
}

void bootstrap();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Yakalanmayan Promise Hatası (Unhandled Rejection):', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Yakalanmayan Hata (Uncaught Exception):', error);
});