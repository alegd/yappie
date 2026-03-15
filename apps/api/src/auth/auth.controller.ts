import { Body, Controller, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { type AuthService } from "./auth.service.js";
import { type RegisterDto } from "./dto/register.dto.js";
import { type LoginDto } from "./dto/login.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
