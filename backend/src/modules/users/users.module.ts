import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersAdminController } from './admin/users-admin.controller'; // 🚨 İsim ve yol düzeltildi
import { UsersService } from './users.service';
import { UsersAdminService } from './admin/users-admin.service'; // 🚨 Yeni servis eklendi
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService, UsersAdminService], // 🚨 UsersAdminService sisteme tanıtıldı
  exports: [UsersService],
})
export class UsersModule {}