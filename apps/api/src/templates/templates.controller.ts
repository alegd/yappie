import { ApiBearerAuth } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { TemplatesService } from "./templates.service.js";
import { CreateTemplateDto } from "./dto/create-template.dto.js";
import { UpdateTemplateDto } from "./dto/update-template.dto.js";

@ApiBearerAuth()
@Controller("templates")
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(@Req() req: { user: { sub: string } }, @Body() dto: CreateTemplateDto) {
    return this.templatesService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Req() req: { user: { sub: string } }) {
    return this.templatesService.findAll(req.user.sub);
  }

  @Get("default")
  getDefault(@Req() req: { user: { sub: string } }) {
    return this.templatesService.getDefault(req.user.sub);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: { user: { sub: string } }) {
    return this.templatesService.findOne(id, req.user.sub);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Req() req: { user: { sub: string } },
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, req.user.sub, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string, @Req() req: { user: { sub: string } }) {
    return this.templatesService.remove(id, req.user.sub);
  }
}
