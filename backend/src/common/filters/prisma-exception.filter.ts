import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

// Sadece Prisma'nın bildiği hataları havada yakalar
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Veritabanı işleminde bir hata oluştu.';

    // P2002: Unique (Benzersiz) constraint hatası (Aynı slug veya email girilmişse)
    if (exception.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      message = 'Bu kayıt zaten mevcut. Lütfen benzersiz bir değer (slug/email) girin.';
    } 
    // P2025: Bulunamadı hatası (Silinmek istenen ID yoksa)
    else if (exception.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      message = 'İşlem yapılmak istenen kayıt bulunamadı.';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: 'Prisma Error',
    });
  }
}