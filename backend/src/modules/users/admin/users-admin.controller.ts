import {
  Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from "@nestjs/common";
import { UsersService } from "../users.service";
import { UsersAdminService } from "./users-admin.service";
import { AdminCreateUserDto } from "../dto/admin-create-user.dto";
import { UpdateUserStatusDto } from "../dto/update-user-status.dto";
import { GetUsersDto } from "../dto/get-user.dto";
import { AuthGuard } from "../../auth/auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { Roles } from "../../auth/roles.decorator";

// Bu controller'a sadece ADMIN girebilir. Guard sırası önemli: önce kimlik, sonra rol.
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/users")
export class UsersAdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersAdminService: UsersAdminService,
  ) {}

  // Tüm kullanıcıları listele (limit/offset/search DTO ile doğrulanır)
  @Get()
  findAll(@Query() query: GetUsersDto) {
    // 🚨 query objesinin içindeki limit ve offset, PaginationDto'dan type-safe olarak geliyor!
    return this.usersAdminService.findAll(
      query.search, 
      query.limit, 
      query.offset
    );
  }

  // Admin tarafından kullanıcı (veya admin) oluşturma. Rol sadece burada verilebilir.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: AdminCreateUserDto) {
    return this.usersService.create(dto, dto.role);
  }

  // Kullanıcı durumunu güncelle (Ban/Askı/Aktif)
  @Patch(":id/status")
  updateStatus(
    @Req() req: any,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    this.assertNotSelf(req.user.id, id);
    return this.usersAdminService.updateStatus(id, dto);
  }

  // Kullanıcıyı tamamen sil
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: any, @Param("id", ParseUUIDPipe) id: string) {
    this.assertNotSelf(req.user.id, id);
    return this.usersAdminService.remove(id);
  }

  private assertNotSelf(currentUserId: string, targetId: string) {
    if (currentUserId === targetId) {
      throw new ForbiddenException("Kendi hesabınız üzerinde bu işlemi yapamazsınız");
    }
  }
}