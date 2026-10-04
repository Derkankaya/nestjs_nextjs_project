import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/auth.guard';
import { CategoriesModule } from './modules/categories/categories.module';
import { CommentsModule } from './modules/comments/comments.module';
import { MediaModule } from './modules/media/media.module';
import { PostsModule } from './modules/posts/posts.module';
import { TagsModule } from './modules/tags/tags.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagesModule } from './modules/messages/messages.module';
@Module({
  imports: [
    // Rate Limiting Kalkanı: 60 saniyede en fazla 20 genel istek sınırı
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 20,
    }]),
    AuthModule,
    CategoriesModule,
    CommentsModule,
    MediaModule,
    NotificationsModule,
    PostsModule,
    TagsModule,
    UsersModule,
    PrismaModule,
    MessagesModule,
  ],
  providers: [
    // 1. DIŞ KALKAN: Spam ve DDOS Koruyucu (Önce bu çalışır)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, 
    },
    // 2. İÇ KALKAN: Kimlik ve Hayalet Kullanıcı (Ghost Admin) Koruyucu
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // <--- YENİ KALKANI ALTINA EKLEDİK
    },
  ],
})
export class AppModule {}