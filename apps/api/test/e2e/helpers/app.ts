import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "http";
import { AppModule } from "../../../src/app.module.js";

export async function createE2eApp(): Promise<{ app: INestApplication; http: Server }> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api/v1", { exclude: ["api/docs", "api/docs-json", "health"] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return { app, http: app.getHttpServer() as Server };
}
