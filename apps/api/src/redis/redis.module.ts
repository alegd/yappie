import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants.js";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const url = process.env.REDIS_URL;
        if (!url) throw new Error("REDIS_URL environment variable is required");
        return new Redis(url);
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
