import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { LocalStorageAdapter } from "./local-storage.adapter.js";

vi.mock("fs/promises");

describe("LocalStorageAdapter", () => {
  let adapter: LocalStorageAdapter;
  const basePath = "/tmp/yappie-test-uploads";

  beforeEach(() => {
    adapter = new LocalStorageAdapter(basePath);
    vi.clearAllMocks();
  });

  describe("save", () => {
    it("should save a file buffer to disk and return the path", async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const buffer = Buffer.from("fake-audio-data");
      const result = await adapter.save("user-1/recording.mp3", buffer);

      expect(result).toBe(path.join(basePath, "user-1/recording.mp3"));
      expect(fs.mkdir).toHaveBeenCalledWith(path.join(basePath, "user-1"), { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(basePath, "user-1/recording.mp3"),
        buffer,
      );
    });
  });

  describe("get", () => {
    it("should read a file from disk and return the buffer", async () => {
      const fileContent = Buffer.from("audio-content");
      vi.mocked(fs.readFile).mockResolvedValue(fileContent);

      const result = await adapter.get("user-1/recording.mp3");

      expect(result).toEqual(fileContent);
      expect(fs.readFile).toHaveBeenCalledWith(path.join(basePath, "user-1/recording.mp3"));
    });

    it("should return null if file does not exist", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(
        Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
      );

      const result = await adapter.get("non-existent.mp3");

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("should delete a file from disk", async () => {
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await adapter.delete("user-1/recording.mp3");

      expect(fs.unlink).toHaveBeenCalledWith(path.join(basePath, "user-1/recording.mp3"));
    });

    it("should not throw if file does not exist", async () => {
      vi.mocked(fs.unlink).mockRejectedValue(
        Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
      );

      await expect(adapter.delete("non-existent.mp3")).resolves.not.toThrow();
    });
  });
});
