import { IsEmail } from "class-validator";

export class DeleteAccountRequestDto {
  @IsEmail()
  email!: string;
}
