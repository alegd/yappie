import { ApiBearerAuth, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
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
import { AudioService } from "./audio.service.js";

@ApiBearerAuth()
@Controller("audio")
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post("upload")
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
      required: ["file"],
    },
  })
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
    @Query("projectId") projectId?: string,
  ) {
    return this.audioService.findAll(
      req.user.sub,
      { page: parseInt(page, 10), limit: parseInt(limit, 10) },
      projectId,
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: { user: { sub: string } }) {
    return this.audioService.findOne(id, req.user.sub);
  }
}
