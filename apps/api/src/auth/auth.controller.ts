import { Body, Controller, Post, Get, Delete, Param, HttpCode, HttpStatus } from "@nestjs/common";
import { type AuthService } from "./auth.service.js";
import { type RegisterDto } from "./dto/register.dto.js";
import { type LoginDto } from "./dto/login.dto.js";
import { type RefreshDto } from "./dto/refresh.dto.js";
import { Public } from "./decorators/public.decorator.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get("sessions/:userId")
  getSessions(@Param("userId") userId: string) {
    return this.authService.getSessions(userId);
  }

  @Delete("sessions/:userId/:sessionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeSession(@Param("sessionId") sessionId: string, @Param("userId") userId: string) {
    return this.authService.revokeSession(sessionId, userId);
  }

  @Delete("sessions/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeAllSessions(@Param("userId") userId: string) {
    return this.authService.revokeAllSessions(userId);
  }
}
