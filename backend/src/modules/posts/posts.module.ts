import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostLikesService } from './post-service/post-likes.service'; 
import { PostBookmarksService } from './post-service/post-bookmarks.service';
import { PostsValidatorService } from './post-service/posts-valitador.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PostsController],
  // 🚨 Böldüğümüz tüm yeni servisleri NestJS'e tanıtıyoruz
  providers: [
    PostsService, 
    PostLikesService, 
    PostBookmarksService, 
    PostsValidatorService
  ],
  exports: [PostsService],
})
export class PostsModule {}