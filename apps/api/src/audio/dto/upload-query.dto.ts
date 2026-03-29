import { IsString, MinLength } from "class-validator";

export class UploadQueryDto {
  @IsString()
  @MinLength(1)
  projectId!: string;
}
