import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
