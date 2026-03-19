import { Body, Controller, Get, Patch, Post, Req, HttpCode, HttpStatus } from "@nestjs/common";
import { type UsersService } from "./users.service.js";
import { type UpdateProfileDto } from "./dto/update-profile.dto.js";
import { type ChangePasswordDto } from "./dto/change-password.dto.js";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getProfile(@Req() req: { user: { sub: string } }) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Patch("me")
  updateProfile(@Req() req: { user: { sub: string } }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  @Post("me/change-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@Req() req: { user: { sub: string } }, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }
}
