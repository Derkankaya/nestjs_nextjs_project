import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Req, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AuthGuard } from "../auth/auth.guard";
import { Public } from "../auth/public.decorator";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get("stats/:id")
  getStats(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.getStats(id);
  }

  @Public()
  @Get("author/:username")
  getAuthorProfile(@Param("username") username: string) {
    return this.usersService.getAuthorProfile(username);
  }

  // ":id" rotasından ÖNCE tanımlı olmalı, yoksa "me" UUID sanılıp 400 döner
  @Get("me")
  @UseGuards(AuthGuard)
  getMe(@Req() req: any) {
    return this.usersService.getMe(req.user.id);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  // Sadece token'daki kullanıcı güncellenir, URL veya body'den id alınmaz
  @Patch("me")
  @UseGuards(AuthGuard)
  updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }
}