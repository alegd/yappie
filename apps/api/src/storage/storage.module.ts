import { Global, Module } from "@nestjs/common";
import { LocalStorageAdapter } from "./local-storage.adapter.js";
import { STORAGE_ADAPTER } from "./storage.interface.js";

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_ADAPTER,
      useFactory: () => new LocalStorageAdapter(process.env.UPLOAD_PATH || "./uploads"),
    },
  ],
  exports: [STORAGE_ADAPTER],
})
export class StorageModule {}
