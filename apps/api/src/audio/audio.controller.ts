import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { type AudioService } from "./audio.service.js";

@Controller("audio")
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: { sub: string } },
    @Query("projectId") projectId?: string,
  ) {
    return this.audioService.upload(file, req.user.sub, projectId);
  }

  @Get()
  findAll(
    @Req() req: { user: { sub: string } },
    @Query("page") page = "1",
    @Query("limit") limit = "10",
  ) {
    return this.audioService.findAll(req.user.sub, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: { user: { sub: string } }) {
    return this.audioService.findOne(id, req.user.sub);
  }
}
