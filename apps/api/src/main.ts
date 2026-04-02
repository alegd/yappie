import { config } from "dotenv";
config();

import "reflect-metadata";
import "./instrument.js";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { ThrottleExceptionFilter } from "./common/throttle-exception.filter.js";
import { validateEnv } from "./config/env.config.js";

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Security headers (CSP, HSTS, X-Frame-Options, etc.)
  app.use(helmet());

  // CORS — allow only the frontend origin
  const frontendUrl = process.env.FRONTEND_URL;
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.setGlobalPrefix("api/v1", {
    exclude: ["api/docs", "api/docs-json", "health"],
  });

  // Whitelist strips unknown properties from DTOs (prevents mass assignment)
  // Transform enables auto-transformation of payloads to DTO instances
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ThrottleExceptionFilter());

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Yappie API")
      .setDescription("Turn audio recordings into actionable Jira tickets with AI")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Yappie API running on http://localhost:${port}`);
}

bootstrap();
