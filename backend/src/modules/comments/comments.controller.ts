import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { CommentStatus } from "@prisma/client";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ModerateCommentDto } from "./dto/moderate-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Public } from "../auth/public.decorator";

@Controller("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(dto, req.user.id);
  }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get()
  findAll(
    @Query("postId") postId?: string,
    @Query("status") status?: CommentStatus,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.commentsService.findAll(
      { postId, status },
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0
    );
  }
  @Public()
  @Get("post/:postId")
  findByPost(
    @Param("postId", ParseUUIDPipe) postId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.commentsService.findByPost(
      postId,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0
    );
  }
  @Public()
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.commentsService.findById(id);
  }

  // 🔒 KORUMALI: Sahibi veya Admin güncelleyebilir
  @UseGuards(AuthGuard) // 🚨 Sadece AuthGuard yeterli, kimlik tespiti için!
  @Patch(":id")
  update(
    @Req() req: any, // 🚨 İsteği yapan kişiyi yakala
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto
  ) {
    return this.commentsService.update(id, dto, req.user); // req.user servise gönderiliyor
  }

  // 🔒 KORUMALI: Sadece yetkililer modere edebilir (Onay/Ret)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN") // 🚨 Burada RolesGuard hala gerekli!
  @Patch(":id/moderate")
  moderate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ModerateCommentDto
  ) {
    return this.commentsService.moderate(id, dto);
  }

  // 🔒 KORUMALI: Sahibi veya Admin silebilir
  @UseGuards(AuthGuard) // 🚨 Sadece AuthGuard yeterli
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: any, @Param("id", ParseUUIDPipe) id: string) {
    return this.commentsService.remove(id, req.user); // req.user servise gönderiliyor
  }
}
