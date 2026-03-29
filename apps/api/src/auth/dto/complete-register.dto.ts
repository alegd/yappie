import { IsEmail, IsString, Length, MinLength } from "class-validator";

export class CompleteRegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(4, 4)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}
