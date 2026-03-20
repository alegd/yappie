import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service.js";
import { CreateProjectDto } from "./dto/create-project.dto.js";
import { UpdateProjectDto } from "./dto/update-project.dto.js";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Req() req: { user: { sub: string } }, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.sub, dto);
  }

  @Get()
  findAll(
    @Req() req: { user: { sub: string } },
    @Query("page") page = "1",
    @Query("limit") limit = "10",
  ) {
    return this.projectsService.findAll(req.user.sub, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: { user: { sub: string } }) {
    return this.projectsService.findOne(id, req.user.sub);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Req() req: { user: { sub: string } },
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.sub, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string, @Req() req: { user: { sub: string } }) {
    return this.projectsService.remove(id, req.user.sub);
  }
}
