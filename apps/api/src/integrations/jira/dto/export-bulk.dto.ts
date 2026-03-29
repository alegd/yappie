import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MinLength } from "class-validator";

export class ExportBulkDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ticketIds!: string[];

  @IsString()
  @MinLength(1)
  projectKey!: string;
}
