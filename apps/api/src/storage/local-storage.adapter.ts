import { Injectable } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";
import { type StorageAdapter } from "./storage.interface.js";

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly basePath: string) {}

  async save(key: string, buffer: Buffer): Promise<string> {
    const fullPath = path.join(this.basePath, key);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return fullPath;
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const fullPath = path.join(this.basePath, key);
      return await fs.readFile(fullPath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullPath = path.join(this.basePath, key);
      await fs.unlink(fullPath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }
      throw error;
    }
  }
}
