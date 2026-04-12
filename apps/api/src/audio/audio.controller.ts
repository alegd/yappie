import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { MAX_FILE_SIZE } from "./audio.constants.js";
import { AudioService } from "./audio.service.js";
import { UploadQueryDto } from "./dto/upload-query.dto.js";

@ApiBearerAuth()
@Controller("audio")
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post("upload")
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_FILE_SIZE } }))
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
    @Query() query: UploadQueryDto,
  ) {
    return this.audioService.upload(file, req.user.sub, query.projectId);
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
      {
        page: parseInt(page, 10) || 1,
        limit: Math.max(1, Math.min(parseInt(limit, 10) || 10, 100)),
      },
      projectId,
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: { user: { sub: string } }) {
    return this.audioService.findOne(id, req.user.sub);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async remove(@Param("id") id: string, @Req() req: { user: { sub: string } }) {
    await this.audioService.delete(id, req.user.sub);
  }
}
