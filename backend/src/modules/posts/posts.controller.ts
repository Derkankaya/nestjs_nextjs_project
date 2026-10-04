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
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { GetPostsDto } from "./dto/get-post.dto";
import { PostsService } from "./posts.service";
import { PostLikesService } from "./post-service/post-likes.service";
import { PostBookmarksService } from "./post-service/post-bookmarks.service";
import { AuthGuard } from "../auth/auth.guard";
import { Public } from "../auth/public.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Controller("posts")
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postLikesService: PostLikesService,
    private readonly postBookmarksService: PostBookmarksService
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: GetPostsDto) {
    return this.postsService.findAll(query);
  }

  @Public()
  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.postsService.findBySlug(slug);
  }
  // ":id" rotalarından ÖNCE tanımlı olmalı
  @Get("my-posts")
  @UseGuards(AuthGuard)
  findMyPosts(@Req() req: any, @Query() query: GetPostsDto) {
    // Sahibi kendi taslaklarını da görmeli
    return this.postsService.findAll(
      { ...query, authorId: req.user.id },
      { includeDrafts: true }
    );
  }
  @Get("my-posts/:id")
  @UseGuards(AuthGuard)
  findMyPost(@Req() req: any, @Param("id", ParseUUIDPipe) id: string) {
    return this.postsService.findById(id, req.user);
  }

  @Get("action/my-likes")
  @UseGuards(AuthGuard)
  getMyLikes(@Req() req: any, @Query() pagination: PaginationDto) {
    return this.postLikesService.getMyLikes(
      req.user.id,
      pagination.limit,
      pagination.offset
    );
  }

  @Get("action/my-bookmarks")
  @UseGuards(AuthGuard)
  getMyBookmarks(@Req() req: any, @Query() pagination: PaginationDto) {
    return this.postBookmarksService.getMyBookmarks(
      req.user.id,
      pagination.limit,
      pagination.offset
    );
  }

  @Public()
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.postsService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(dto, req.user);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(
    @Req() req: any,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto
  ) {
    return this.postsService.update(id, dto, req.user);
  }

  @Patch(":id/status")
  @UseGuards(AuthGuard)
  updateStatus(
    @Req() req: any,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto
  ) {
    return this.postsService.updateStatus(id, dto.status, req.user);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: any, @Param("id", ParseUUIDPipe) id: string) {
    return this.postsService.remove(id, req.user);
  }

  @Post(":id/like")
  @UseGuards(AuthGuard)
  toggleLike(@Param("id", ParseUUIDPipe) postId: string, @Req() req: any) {
    return this.postLikesService.toggleLike(postId, req.user.id);
  }

  @Post(":id/bookmark")
  @UseGuards(AuthGuard)
  toggleBookmark(@Param("id", ParseUUIDPipe) postId: string, @Req() req: any) {
    return this.postBookmarksService.toggleBookmark(req.user.id, postId);
  }
}
